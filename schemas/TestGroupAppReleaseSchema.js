exports.CreateSchema = async () => {
    const schema = new Parse.Schema('TestGroupAppRelease');
    try {
        await schema.get({ useMasterKey: true });
        console.log("TestGroupAppReleaseSchema schema loaded previously.");
    } catch {
        console.log("TestGroupAppReleaseSchema schema not found. Creating it now.");
        schema
        .addNumber("order")
        .addString("appReleaseId")
        .addString("testGroupId");
        await schema.save({ useMasterKey: true });
    }
}
