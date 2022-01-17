exports.CreateSchema = async () => {
    const schema = new Parse.Schema('ActivityLogBlockHeader');
    try {
        await schema.get({ useMasterKey: true });
        console.log("ActivityLogBlockHeader schema loaded previously.");
    } catch {
        console.log("ActivityLogBlockHeader schema not found. Creating it now.");
        schema
        .addNumber("id")
        .addNumber("blockType")
        .addNumber("blockLength")
        .addNumber("format")
        .addString("deviceId")
        .addNumber("timestamp")
        .addNumber("count")
        .addNumber("epochInterval")
        .addNumber("promptConfiguration")
        .addNumber("battery")
        .addNumber("accelerometer")
        .addNumber("firmware")
        .addNumber("checksum")
        .addPointer('userId', '_User');
        await schema.save({ useMasterKey: true });
    }
}
