exports.CreateSchema = async() => {
    const schema = new Parse.Schema('WearableDevice');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Wearable Device schema loaded previously.");
    } catch {
        console.log("Wearable Device schema not found. Creating it now.");
        schema
        .addString("name")
        .addString("macAddress")
        .addDate("lastTimeConnected")
        .addNumber("batteryLevel")
        .addString("manufacturerName")
        .addString("modelNumber")
        .addString("serialNumber")
        .addString("firmwareRevision")
        .addString("hardwareRevision")
        .addString("softwareRevision")
        .addPointer('user', '_User')
        await schema.save({ useMasterKey: true });
    }
}