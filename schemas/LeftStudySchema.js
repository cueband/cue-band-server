exports.CreateSchema = async() => {
    const schema = new Parse.Schema('LeftStudy');
    try {
        await schema.get({ useMasterKey: true });
        console.log("LeftStudy schema loaded previously.");
    } catch {
        console.log("LeftStudy schema not found. Creating it now.");
        schema
        .addString("studyBranch")
        .addString("studyState")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}