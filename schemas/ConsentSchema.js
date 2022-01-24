exports.CreateSchema = async() => {

    const schema = new Parse.Schema('Consent');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Consent schema loaded previously.");
    } catch {
        console.log("Consent schema not found. Creating it now.");
        schema
        .addNumber("localId")
        .addString("question1")
        .addString("question1Answer")
        .addString("question2")
        .addString("question2Answer")
        .addString("question3")
        .addString("question3Answer")
        .addString("question4")
        .addString("question4Answer")
        .addString("question5")
        .addString("question5Answer")
        .addString("question6")
        .addString("question6Answer")
        .addString("question7")
        .addString("question7Answer")
        .addString("question8")
        .addString("question8Answer")
        .addString("question9")
        .addString("question9Answer")
        .addString("question9AnswerEthnicGroup")
        .addDate("whenFilled")
        .addString("name")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
