exports.CreateSchema = async() => {

    const schema = new Parse.Schema('DemographicsData');
    try {
        await schema.get({ useMasterKey: true });
        console.log("DemographicsData schema loaded previously.");
    } catch {
        console.log("DemographicsData schema not found. Creating it now.");
        schema
        .addNumber("token")
        .addString("ageRange")
        .addString("liveOnUk")
        .addString("ethnicity")
        .addString("gender")
        await schema.save({ useMasterKey: true });
    }
}
