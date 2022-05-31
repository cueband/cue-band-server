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
        .addString("minAndroidAppVersion")
        .addString("maxAndroidAppVersion")
        .addString("maxIosAppVersion")
        .addString("minIosAppVersion")
        await schema.save({ useMasterKey: true });
    }
}
