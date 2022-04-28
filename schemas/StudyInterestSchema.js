exports.CreateSchema = async() => {

    const schema = new Parse.Schema('StudyInterest');
    try {
        await schema.get({ useMasterKey: true });
        console.log("StudyInterest schema loaded previously.");
    } catch {
        console.log("StudyInterest schema not found. Creating it now.");
        schema
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