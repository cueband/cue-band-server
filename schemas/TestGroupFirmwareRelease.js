exports.CreateSchema = async () => {
    const schema = new Parse.Schema('TestGroupFirmwareRelease');
    try {
        await schema.get({ useMasterKey: true });
        console.log("TestGroupFirmwareReleaseSchema schema loaded previously.");
    } catch {
        console.log("TestGroupFirmwareReleaseSchema schema not found. Creating it now.");
        schema
        .addNumber("order")
        .addPointer("firmwareRelease", "FirmwareRelease")
        .addPointer("testGroup", "TestGroup")
        .addString("text");
        await schema.save({ useMasterKey: true });
    }
}
