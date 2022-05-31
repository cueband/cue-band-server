exports.CreateSchema = async () => {
    const schema = new Parse.Schema('TestGroup');
    try {
        await schema.get({ useMasterKey: true });
        console.log("TestGroupSchema schema loaded previously.");
    } catch {
        console.log("TestGroupSchema schema not found. Creating it now.");
        schema
        .addString("name")
        await schema.save({ useMasterKey: true });
    }
}
