const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
let  options = {
    headers: {
        'Content-Type': 'application/vnd.api+json',
        'Authorization': 'Bearer eii4mS7Rzs09Tw.atlasv1.ri71MHBKszyaIz1FPugPobS2AyW8ObeGvyq8hG9mEqhqPysmiyPzWLNsNUk245UEkj4' 
    }};
async function  getOutputs() {
    var terraformOutPuts = [];
    try {
        options = {
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': 'Bearer eii4mS7Rzs09Tw.atlasv1.ri71MHBKszyaIz1FPugPobS2AyW8ObeGvyq8hG9mEqhqPysmiyPzWLNsNUk245UEkj4' 
            }
        };
        const stateVersionEndpoint = "https://ec2-54-234-137-178.compute-1.amazonaws.com/api/v2/workspaces/ws-LYCqcFRz36T7F5cx/current-state-version";
        console.log("stateVersionEndpoint:"+stateVersionEndpoint);
        const verResponse = await axios.get(stateVersionEndpoint,options);
        
        console.log("stateId:"+JSON.stringify(verResponse.data.data.relationships.outputs.data[0].id));
        for(  i = 0; i < verResponse.data.data.relationships.outputs.data.length; i++){
            let stateId = verResponse.data.data.relationships.outputs.data[i].id;
            let outputsEndpoint = "https://ec2-54-234-137-178.compute-1.amazonaws.com/api/v2/state-version-outputs/wsout-kCiTF6ugJBbvAeu7";
            let res = await axios.get(outputsEndpoint,options);
            console.log("res.data.data.attributes"+JSON.stringify(res.data.data.attributes));
            var output = { "name": res.data.data.attributes.name, "value": res.data.data.attributes.value};
            terraformOutPuts.push(output);
        }
        
        console.log("terraformOutPuts:"+JSON.stringify(terraformOutPuts));


    }catch(err){
        console.log("Error in getOutputs:"+err.message);
        throw new Error(`Error in getOutputs${err.message}`);
    }
}

async function invokeServiceNowScriptedRestAPI(){
    let data = {"data":"val"};
    let res = await axios.post("https://dev63722.service-now.com/api/482432/tfe_notification_listener",data);
    console.log("res:"+JSON.stringify(res.data));

}

async function fetchSentinelPolicyDetails(){
    try{
        options = {
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': 'Bearer eii4mS7Rzs09Tw.atlasv1.ri71MHBKszyaIz1FPugPobS2AyW8ObeGvyq8hG9mEqhqPysmiyPzWLNsNUk245UEkj4' 
            }};
    let policyCheckUrl = "https://ec2-54-234-137-178.compute-1.amazonaws.com/api/v2/runs/run-LboY14A5EcRF3eXm/policy-checks";
    let res = await axios.get(policyCheckUrl,options);
   console.log("Polciy Name:"+JSON.stringify(res.data.data[0].attributes.result.sentinel.policies[0].policy));
   console.log("Trace:"+res.data.data[0].attributes.result.sentinel.policies[0].trace.print);
    }catch(err){
        console.log("Error in fetchSentinelPolicyDetails:"+err.message);
        throw new Error(`Error in fetchSentinelPolicyDetails${err.message}`);
    }
}

//getOutputs();
//invokeServiceNowScriptedRestAPI();
//fetchSentinelPolicyDetails();


async function getPlanData(){
    options = {
        headers: {
            'Content-Type': 'application/vnd.api+json',
            'Authorization': 'Bearer eii4mS7Rzs09Tw.atlasv1.ri71MHBKszyaIz1FPugPobS2AyW8ObeGvyq8hG9mEqhqPysmiyPzWLNsNUk245UEkj4' 
        }};
let policyCheckUrl = "https://ec2-54-234-137-178.compute-1.amazonaws.com/api/v2/runs/run-2eD3kxaJZL1UE231/plan";
let res = await axios.get(policyCheckUrl,options);
console.log("Polciy Name:"+JSON.stringify(res.data.data.attributes.status));
}
//getPlanData();

async function getRunStatus(runId){
    options = {
        headers: {
            'Content-Type': 'application/vnd.api+json',
            'Authorization': 'Bearer eii4mS7Rzs09Tw.atlasv1.ri71MHBKszyaIz1FPugPobS2AyW8ObeGvyq8hG9mEqhqPysmiyPzWLNsNUk245UEkj4' 
        }};
let policyCheckUrl = "https://ec2-54-234-137-178.compute-1.amazonaws.com/api/v2/runs/"+runId+"/run-events";
let res = await axios.get(policyCheckUrl,options);
console.log("Polciy Name:"+JSON.stringify(res.data.data[0].attributes.action));
return res.data.data[0].attributes.action;

}

//getRunStatus();

async function invokeNamingEngine(){
    let namingApiRequest = {
        "Platform":"azure",
        "Location":"useast",
        "App":"myapp",
        "Environment":"development",
        "Resource":"virtual_machine_windows",
        "OS": "windows"
    };
    let nameEngineRespone = await axios.post("https://saraths-first.azurewebsites.net/api/NamingPolicyEngine", namingApiRequest);
    console.log("nameEngineRespone:"+JSON.stringify(nameEngineRespone.data.name));
}

//invokeNamingEngine();

async function getAllWorkspaces(){
    let getWorkspaceUrl = "https://ec2-54-234-137-178.compute-1.amazonaws.com/api/v2/organizations/Slalom/workspaces";
    const res = await axios.get(getWorkspaceUrl, options);
    //console.log("res:"+JSON.stringify(res.data.data));
    let workspaces = [];

    for (let i=0; i < res.data.data.length; i++ ) {
        let workspace = res.data.data[i];
        let workspaceId = workspace.id;
        let workspaceName =  workspace.attributes.name;
        let runId = workspace.relationships["current-run"].data.id;
        let status = await getRunStatus(runId);
        console.log("status:"+status);
        workspaces.push(
                   {
                       "workspaceId":workspaceId,
                       "workspaceName":workspaceName,
                       "runId":runId,
                       "runStatus":runStatus
                   }
        );

    }
    console.log( JSON.stringify( workspaces));
    return workspaces;
}
 getAllWorkspaces();

