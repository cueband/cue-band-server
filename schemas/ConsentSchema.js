exports.CreateSchema = async() => {

    const schema = new Parse.Schema('Consent');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Consent schema loaded previously.");
    } catch {
        console.log("Consent schema not found. Creating it now.");
        schema
        .addString("token")
        .addString("question1Answer")
        .addString("question2Answer")
        .addString("question3Answer")
        .addString("question4Answer")
        .addString("question5Answer")
        .addString("question6Answer")
        .addString("question7Answer")
        .addString("question8Answer")
        .addString("question9Answer")
        .addString("name")
        await schema.save({ useMasterKey: true });
    }
}
