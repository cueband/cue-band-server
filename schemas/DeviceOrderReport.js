exports.CreateSchema = async() => {
    const schema = new Parse.Schema('DeviceOrderReport');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Device Order Report schema loaded previously.");
    } catch {
        console.log("Device Order Report not found. Creating it now.");
        schema
        .addFile("csvFile")
        .addDate("startDate")
        .addDate("endDate")
        await schema.save({ useMasterKey: true });
    }
}