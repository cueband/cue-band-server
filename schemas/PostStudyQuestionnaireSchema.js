exports.CreateSchema = async() => {
    const schema = new Parse.Schema('PostStudyQuestionnaire');
    try {
        await schema.get({ useMasterKey: true });
        console.log("PostStudyQuestionnaire schema loaded previously.");
    } catch {
        console.log("PostStudyQuestionnaire schema not found. Creating it now.");
        schema
        .addString("Question1Answer")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}