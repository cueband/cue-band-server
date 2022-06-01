exports.CreateSchema = async () => {
    const schema = new Parse.Schema('AppRelease');
    try {
        await schema.get({ useMasterKey: true });
        console.log("AppReleaseSchema schema loaded previously.");
    } catch {
        console.log("AppReleaseSchema schema not found. Creating it now.");
        schema
        .addString("version")
        .addString("minFirmwareVersion")
        .addString("maxFirmwareVersion")
        .addString("platform")
        .addString("downloadLink")
        await schema.save({ useMasterKey: true });
    }
}
