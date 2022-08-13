exports.CreateSchema = async () => {
    const schema = new Parse.Schema('ConsentReport');
    try {
        await schema.get({ useMasterKey: true });
        console.log("ConsentReport schema loaded previously.");
    } catch {
        console.log("ConsentReport schema not found. Creating it now.");
        schema
        .addFile("csvFile")
        .addDate("startDate")
        .addDate("endDate")
        await schema.save({ useMasterKey: true });
    }
}
