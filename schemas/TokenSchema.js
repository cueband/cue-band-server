exports.CreateSchema = async() => {

    const schema = new Parse.Schema('Token');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Token schema loaded previously.");
    } catch {
        console.log("Token schema not found. Creating it now.");
        schema
        .addString("token")
        .addDate("expireDate")
        await schema.save({ useMasterKey: true });
    }
}


