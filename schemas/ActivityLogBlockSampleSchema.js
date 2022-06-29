exports.CreateSchema = async () => {
    const schema = new Parse.Schema('ActivityLogBlockSample');
    try {
        await schema.get({ useMasterKey: true });
        console.log("ActivityLogBlockSample schema loaded previously.");
    } catch {
        console.log("ActivityLogBlockSample schema not found. Creating it now.");
        schema
        .addNumber("localId")
        .addNumber("events")
        .addNumber("promptsSteps")
        .addNumber("meanFilteredSvmmo")
        .addNumber("meanSvmmo")
        .addNumber("blockId")
        .addNumber("order")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
