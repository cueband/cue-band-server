exports.CreateSchema = async() => {

    const schema = new Parse.Schema('Assessment');
    try {
        await schema.get({ useMasterKey: true });
        console.log("Assessment schema loaded previously.");
    } catch {
        console.log("Assessment schema not found. Creating it now.");
        schema
        .addNumber("romps1")
        .addNumber("romps2")
        .addNumber("romps3")
        .addNumber("romps4")
        .addNumber("romps5")
        .addNumber("romps6")
        .addNumber("romps7")
        .addNumber("romps8")
        .addNumber("romps9")
        .addNumber("updrs22")
        .addArray("nmsqDepressionfrequency")
        .addArray("nmsqDepressionseverity")
        .addArray("nmsqAnxietyfrequency")
        .addArray("nmsqAnxietyseverity")
        .addArray("nmsqApathyfrequency")
        .addArray("nmsqApathyseverity")
        .addArray("nmsqPsychosisfrequency")
        .addArray("nmsqPsychosisseverity")
        .addArray("nmsqImpulsecontrolandrelateddisordersfrequency")
        .addArray("nmsqImpulsecontrolandrelateddisordersseverity")
        .addArray("nmsqCognitionfrequency")
        .addArray("nmsqCognitionseverity")
        .addArray("nmsqOrthostatichypotensionfrequency")
        .addArray("nmsqOrthostatichypotensionseverity")
        .addArray("nmsqUrinaryfrequency")
        .addArray("nmsqUrinaryseverity")
        .addArray("nmsqSexualfrequency")
        .addArray("nmsqSexualseverity")
        .addArray("nmsqGastrointestinalfrequency")
        .addArray("nmsqGastrointestinalseverity")
        .addArray("nmsqSleepandwakefulnessfrequency")
        .addArray("nmsqSleepandwakefulnessseverity")
        .addArray("nmsqPainfrequency")
        .addArray("nmsqPainseverity")
        .addArray("nmsqOtherfrequency1")
        .addArray("nmsqOtherfrequency2")
        .addArray("nmsqOtherseverity")
        .addArray("pdq8")
        .addString("token")
        .addNumber("assessmentNumber")
        await schema.save({ useMasterKey: true });
    }
}

