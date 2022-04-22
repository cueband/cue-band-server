exports.CreateSchema = async () => {
    const schema = new Parse.Schema('AppFeedback');
    try {
        await schema.get({ useMasterKey: true });
        console.log("AppFeedback schema loaded previously.");
    } catch {
        console.log("AppFeedback schema not found. Creating it now.");
        schema
        .addString("text")
        .addDate("recordedTime")
        .addString("username")
        .addNumber("rating")
        .addString("deviceType")
        await schema.save({ useMasterKey: true });
    }
}