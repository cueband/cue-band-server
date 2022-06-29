exports.CreateSchema = async() => {
    const schema = new Parse.Schema('DeviceOrderSchema');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Device Order schema loaded previously.");
    } catch {
        console.log("Device Order schema not found. Creating it now.");
        schema
        .addString("labelId")
        .addString("trackingCode")
        .addString("address")
        .addString("deviceBox")
        .addPointer('user', '_User')
        await schema.save({ useMasterKey: true });
    }
}