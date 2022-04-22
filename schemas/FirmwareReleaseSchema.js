exports.CreateSchema = async () => {
    const schema = new Parse.Schema('FirmwareRelease');
    try {
        await schema.get({ useMasterKey: true });
        console.log("FirmwareReleaseSchema schema loaded previously.");
    } catch {
        console.log("FirmwareReleaseSchema schema not found. Creating it now.");
        schema
        .addString("downloadLink")
        .addString("version")
        .addBoolean("active")
        .addString("text")
        await schema.save({ useMasterKey: true });
    }
}
