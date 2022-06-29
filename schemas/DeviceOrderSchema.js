exports.CreateSchema = async() => {
    const schema = new Parse.Schema('DeviceBoxSchema');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Device Box schema loaded previously.");
    } catch {
        console.log("Device Box schema not found. Creating it now.");
        schema
        .addString("labelId")
        .addString("trackingCode")
        .addString("address")
        .addString("deviceBox")
        .addPointer('user', '_User')
        await schema.save({ useMasterKey: true });
    }
}