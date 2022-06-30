exports.CreateSchema = async () => {
    const schema = new Parse.Schema('ActivityLogBlockHeader');
    try {
        await schema.get({ useMasterKey: true });
        console.log("ActivityLogBlockHeader schema loaded previously.");
    } catch {
        console.log("ActivityLogBlockHeader schema not found. Creating it now.");
        schema
        .addNumber("localId")
        .addNumber("blockId")
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
        .addString("raw")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
