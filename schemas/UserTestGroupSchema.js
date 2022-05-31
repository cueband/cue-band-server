exports.CreateSchema = async () => {
    const schema = new Parse.Schema('UserTestGroup');
    try {
        await schema.get({ useMasterKey: true });
        console.log("UserTestGroupSchema schema loaded previously.");
    } catch {
        console.log("UserTestGroupSchema schema not found. Creating it now.");
        schema
        .addPointer('user', '_User')
        .addString("testGroupId");
        await schema.save({ useMasterKey: true });
    }
}
