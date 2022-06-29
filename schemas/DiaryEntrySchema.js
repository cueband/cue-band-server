exports.CreateSchema = async() => {

    const schema = new Parse.Schema('DiaryEntry');
    try {
        await schema.get({ useMasterKey: true });
        console.log("DiaryEntry schema loaded previously.");
    } catch {
        console.log("DiaryEntry schema not found. Creating it now.");
        schema
        .addNumber("localId")
        .addDate("recordedTime")
        .addDate("dayDate")
        .addNumber("month")
        .addNumber("year")
        .addNumber("frequency")
        .addNumber("duration")
        .addNumber("severity")
        .addBoolean("partialAssessment")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}


