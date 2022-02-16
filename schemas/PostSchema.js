exports.CreateSchema = async() => {
    const schema = new Parse.Schema('Post');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Post schema loaded previously.");
    } catch {
        console.log("Post schema not found. Creating it now.");
        schema
        .addString("title")
        .addString("content")
        .addString("image")
        .addString("buttonName")
        .addString("url")
        .addBoolean("enabled")
        .addString("branch")
        await schema.save({ useMasterKey: true });
    }
}