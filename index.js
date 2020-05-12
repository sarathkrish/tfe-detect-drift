const core = require('@actions/core')
const axios = require('axios');

// Setting SSL OFF // Need to remove this on prod
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var token;
var organizationName;
var options;
var terraformHost;
var serviceNowEndPoint;
//var serviceNowEndPoint = "https://dev63722.service-now.com/api/482432/tfe_notification_listener";


async function main() {
    try {
        // Global variables
        token = core.getInput('terraformToken');
        organizationName = core.getInput('terraformOrg');
        terraformHost = core.getInput('terraformHost');
        serviceNowEndPoint = core.getInput('serviceNowUrl');

        // Log Input Variables
        console.log("**************Input*********************");
        console.log("organizationName:" + organizationName);
        console.log("terraformHost:" + terraformHost);
        console.log("serviceNowEndPoint:" + serviceNowEndPoint);
        console.log("**************Input*********************");


        // Terraform Request Header 
        options = {
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': 'Bearer ' + token
            }
        };


        //Step 1
        // Get All workspace with Run Status 
        let workSpaces = await getAllWorkspaces();

        // Step 2 Invoke Plan for each workspace and check status
        for (let i = 0; i < workSpaces.length; i++) {
            if ("finished" == workSpaces[i].runStatus || "organization_policy_passed" == workSpaces[i].runStatus || "discarded" == workSpaces[i].runStatus || "cancelled" == workSpaces[i].runStatus) {
                let planRunId = await run(workSpaces[i].workspaceId);
               await sendFeedback(planRunId);
            }
        }


    } catch (error) {
        // Log Incident 
        let sericeNowMessage = "Drift Detect Job Failed";
        //  Create INC
        core.setFailed(error.message);
    }
}

async function getAllWorkspaces() {
    let getWorkspaceUrl = "https://" + terraformHost + "/api/v2/organizations/" + organizationName + "/workspaces";
    const res = await axios.get(getWorkspaceUrl, options);
    let workspaces = [];

    for (let i = 0; i < res.data.data.length; i++) {
        let workspace = res.data.data[i];
        let workspaceId = workspace.id;
        let workspaceName = workspace.attributes.name;
        let runId = workspace.relationships["current-run"].data.id;
        let status = await getRunStatus(runId);
        workspaces.push(
            {
                "workspaceId": workspaceId,
                "workspaceName": workspaceName,
                "runId": runId,
                "runStatus": status
            }
        );

    }
    console.log(JSON.stringify(workspaces));
    return workspaces;
}

async function getRunStatus(runId) {
    try {
        let runUrl = "https://" + terraformHost + "/api/v2/runs/" + runId + "/run-events";
        let res = await axios.get(runUrl, options);
        return res.data.data[0].attributes.action;
    } catch (err) {
        console.log("Error in getRunStatus:" + err.message);
        throw new Error(`Error in getRunStatus${err.message}`);
    }

}

async function run(workSpaceId) {
    try {
        const terraformRunEndpoint = "https://" + terraformHost + "/api/v2/runs";
        let request = {
            data: {
                attributes: { "is-destroy": false, "message": "Pipeline invocation" },
                type: "runs",
                relationships: {
                    workspace: {
                        data: {
                            type: "workspaces",
                            id: workSpaceId
                        }
                    }
                }
            }
        };
        console.log("run request:" + JSON.stringify(request));
        const res = await axios.post(terraformRunEndpoint, request, options);
        console.log("run response:" + res.data.data);
        const runId = res.data.data.id;
        return runId;
    } catch (err) {
        console.log("Error in run:" + err.message);
        throw new Error(`Error in run ${err.message}`);
    }
}





async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}


async function sendFeedback(runId) {
    var checkStatus = true;

    do {
        await sleep(60000);
        const status = await checkRunStatus(runId);
        console.log("status:"+status);

        if ("errored" == status) {
            checkStatus = false;
            console.log("Execution Failed in TFE");
            // Send Failed Response
           // let sericeNowMessage = await buildServiceNowFailureResponse("Execution Failed in TFE");
           // await invokeServiceNowScriptedRestAPI(sericeNowMessage);
            console.log("Setting pipeline Failed!");
            core.setFailed("Execution Failed in TFE");
        }
        else if ("policy_checked" == status) {
            checkStatus = false;
            console.log("Sentinel policy passed, ready to apply");
           // let sericeNowMessage = await buildServiceNowSuccessResponse(outputs);
            //console.log("sericeNowMessage:" + sericeNowMessage);
           // await invokeServiceNowScriptedRestAPI(sericeNowMessage);
        }

    } while (checkStatus);

}

async function checkRunStatus(runId) {

    try {
        const terraformRunStatusEndpoint = "https://" + terraformHost + "/api/v2/runs/" + runId;
        console.log("terraformRunStatusEndpoint:" + terraformRunStatusEndpoint);
        const res = await axios.get(terraformRunStatusEndpoint, options);
        console.log("run response:" + JSON.stringify(res.data.data));
        return res.data.data.attributes.status;
    }
    catch (err) {
        console.log("Error in checking run status:" + err.message);
        throw new Error(`Error in checking run status${err.message}`);
    }

}


async function buildServiceNowSuccessResponse(outputs) {

    let response = {
        "TaskId": workSpaceName,
        "TFEResponse": {
            "TFEWorkspaceId": workSpaceId,
            "TFEWorkspaceName": workSpaceName,
            "TFEOutputs": outputs
        },
        "Message": "Success"
    }
    return response;
}

async function buildServiceNowFailureResponse(reason) { 

    console.log("response:" + JSON.stringify(response));
    return response;
}

async function invokeServiceNowScriptedRestAPI(data) {
    try {
        let res = await axios.post(serviceNowEndPoint, data);
        console.log("service Now response:" + JSON.stringify(res.data));
    } catch (err) {
        console.log("Error in invokeServiceNowScriptedRestAPI:" + err.message);
        throw new Error(`Error in invokeServiceNowScriptedRestAPI${err.message}`);
    }

}



async function getPlanStatus(runId) {

    try {
        let planUrl = "https://" + terraformHost + "/api/v2/runs/" + runId + "/plan";
        let res = await axios.get(planUrl, options);
        return res.data.data.attributes.status;

    } catch (err) {
        console.log("Error in getPlanStatus:" + err.message);
        throw new Error(`Error in getPlanStatus${err.message}`);
    }
}


main();
