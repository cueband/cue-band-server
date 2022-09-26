exports.CreateSchema = async() => {
    const schema = new Parse.Schema('UserStudyEmail');
    try {
        await schema.get({ useMasterKey: true });
        console.log("User Study Email schema loaded previously.");
    } catch {
        console.log("User Study Email not found. Creating it now.");
        schema
        .addPointer('user', '_User')
        await schema.save({ useMasterKey: true });
    }
}