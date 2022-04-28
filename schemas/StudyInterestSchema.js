exports.CreateSchema = async() => {

    const schema = new Parse.Schema('StudyInterest');
    try {
        await schema.get({ useMasterKey: true });
        console.log("StudyInterest schema loaded previously.");
    } catch {
        console.log("StudyInterest schema not found. Creating it now.");
    
        const clp = {
            "find": {
              "role:Admin": true
            },
            "get": {
              "role:Admin": true
            },
            "create": { 
                "role:Admin": true 
            },
            "update": { 
                "role:Admin": true 
            },
            "delete": { 
                "role:Admin": true 
            }
          };
        schema
        .setCLP(clp)
        .addString("email")
        .addBoolean("activated")
        .addString("activationToken")
        .addBoolean("formalTrial")
        .addString("smartphoneType")
        .addBoolean("study")
        .addString("studyToken")
        await schema.save({ useMasterKey: true });
    }
}