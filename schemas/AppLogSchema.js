exports.CreateSchema = async() => {

    const schema = new Parse.Schema('AppLog');
    try {
        await schema.get({ useMasterKey: true });
        console.log("AppLog schema loaded previously.");
    } catch {
        console.log("AppLog schema not found. Creating it now.");
        schema
        .addString("message")
        .addString("level")
        .addDate("timestamp")
        .addString("appVersion")
        .addString("firmwareVersion")
        .addString("deviceModel")
        .addString("osVersion")
        .addString("platform")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
