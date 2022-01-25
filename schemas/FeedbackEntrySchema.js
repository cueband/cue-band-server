exports.CreateSchema = async() => {

    const schema = new Parse.Schema('FeedbackEntry');
    try {
        await schema.get({ useMasterKey: true });
        console.log("FeedbackEntry schema loaded previously.");
    } catch {
        console.log("FeedbackEntry schema not found. Creating it now.");
        schema
        .addNumber("localId")
        .addDate("recordedTime")
        .addDate("dayDate")
        .addNumber("month")
        .addNumber("year")
        .addNumber("frequency")
        .addNumber("duration")
        .addNumber("severity")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
