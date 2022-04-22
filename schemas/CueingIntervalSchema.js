exports.CreateSchema = async () => {
    const schema = new Parse.Schema('CueingInterval');
    try {
        await schema.get({ useMasterKey: true });
        console.log("CueingInterval schema loaded previously.");
    } catch {
        console.log("CueingInterval schema not found. Creating it now.");
        schema
        .addNumber("id")
        .addNumber("startTimeHours")
        .addNumber("startTimeMinutes")
        .addNumber("endTimeHours")
        .addNumber("endTimeMinutes")
        .addNumber("duration")
        .addNumber("weekDay")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
