exports.CreateSchema = async() => {

    const schema = new Parse.Schema('StudyData');
    try {
        await schema.get({ useMasterKey: true });
        console.log("StudyData schema loaded previously.");
    } catch {
        console.log("StudyData schema not found. Creating it now.");
        schema
        .addPointer('user', '_User')
        .addNumber("localId")
        .addString("studyBranch")
        .addString("currentState")
        .addString("previousState")
        .addDate("serverLastUpdate")
        .addDate("clientLastUpdate")
        .addBoolean("cueingEnabled")

        //AppStartedFirstTime
        .addDate("appStartedFirstTimeDateStarted")
        .addDate("appStartedFirstTimeDateFinished")
        .addBoolean("appStartedFirstTimeReached")
        .addString("appStartedFirstTimeProgressCondition")
        .addBoolean("appStartedFirstTimeDone")

        //InterestedInParticipating
        .addDate("interestedInParticipatingDateStarted")
        .addDate("interestedInParticipatingDateFinished")
        .addBoolean("interestedInParticipatingReached")
        .addString("interestedInParticipatingProgressCondition")
        .addBoolean("interestedInParticipatingDone")
        .addBoolean("interestedInParticipatingAnsweredYes")

        //GiveConsent
        .addDate("giveConsentDateStarted")
        .addDate("giveConsentDateFinished")
        .addBoolean("giveConsentReached")
        .addString("giveConsentProgressCondition")
        .addBoolean("giveConsentDone")

        //InsertToken
        .addDate("insertTokenDateStarted")
        .addDate("insertTokenDateFinished")
        .addBoolean("insertTokenReached")
        .addString("insertTokenProgressCondition")
        .addBoolean("insertTokenDone")
        .addBoolean("insertTokenHasToken")
        .addString("insertTokenToken")
        .addBoolean("insertTokenIsTokenExpired")
        .addString("insertTokenSmartphoneType")
        .addString("insertTokenEmail")

        //SelectBranches
        .addDate("selectBranchesDateStarted")
        .addDate("selectBranchesDateFinished")
        .addBoolean("selectBranchesReached")
        .addString("selectBranchesProgressCondition")
        .addBoolean("selectBranchesDone")
        .addBoolean("selectBranchesChooseTrial")
        .addBoolean("selectBranchesChooseFreeLiving")
        .addString("selectBranchesDevice")
        .addString("selectBranchesManufacturer")
        .addString("selectBranchesDeviceName")
        .addString("selectBranchesVersion")
        .addString("selectBranchesPlatform")
        .addString("selectBranchesIdiom")
        .addString("selectBranchesDeviceType")

        //CreateAccount
        .addDate("createAccountDateStarted")
        .addDate("createAccountDateFinished")
        .addBoolean("createAccountReached")
        .addString("createAccountProgressCondition")
        .addBoolean("createAccountDone")

        //PartialAssessment
        .addDate("partialAssessmentDateStarted")
        .addDate("partialAssessmentDateFinished")
        .addBoolean("partialAssessmentReached")
        .addString("partialAssessmentProgressCondition")
        .addBoolean("partialAssessmentDone")
        .addString("partialAssessmentKey")

        //TeachDiaryUse
        .addDate("teachDiaryUseDateStarted")
        .addDate("teachDiaryUseDateFinished")
        .addBoolean("teachDiaryUseReached")
        .addString("teachDiaryUseProgressCondition")
        .addBoolean("teachDiaryUseDone")
        .addNumber("teachDiaryUseWhenToPromptHours")
        .addNumber("teachDiaryUseWhenToPromptMinutes")

        //WaitingForBranchApproval
        .addDate("waitingForBranchApprovalDateStarted")
        .addDate("waitingForBranchApprovalDateFinished")
        .addBoolean("waitingForBranchApprovalReached")
        .addString("waitingForBranchApprovalProgressCondition")
        .addBoolean("waitingForBranchApprovalDone")

        //AskDeliveryInfo
        .addDate("askDeliveryInfoDateStarted")
        .addDate("askDeliveryInfoDateFinished")
        .addBoolean("askDeliveryInfoReached")
        .addString("askDeliveryInfoProgressCondition")
        .addBoolean("askDeliveryInfoDone")

        //WaitingForDevice
        .addDate("waitingForDeviceDateStarted")
        .addDate("waitingForDeviceDateFinished")
        .addBoolean("waitingForDeviceReached")
        .addString("waitingForDeviceProgressCondition")
        .addBoolean("waitingForDeviceDone")
        .addString("deliveryProgress")

        //Assessment1
        .addDate("assessment1DateStarted")
        .addDate("assessment1DateFinished")
        .addBoolean("assessment1Reached")
        .addString("assessment1ProgressCondition")
        .addBoolean("assessment1Done")
        .addString("assessment1Key")

        //CreateSchedule
        .addDate("createScheduleDateStarted")
        .addDate("createScheduleDateFinished")
        .addBoolean("createScheduleReached")
        .addString("createScheduleProgressCondition")
        .addBoolean("createScheduleDone")

        //CueingMethod1
        .addDate("cueingMethod1DateStarted")
        .addDate("cueingMethod1DateFinished")
        .addBoolean("cueingMethod1Reached")
        .addString("cueingMethod1ProgressCondition")
        .addBoolean("cueingMethod1Done")
        .addDate("cueingMethod1FinishingDate")

        //Assessment2
        .addDate("assessment2DateStarted")
        .addDate("assessment2DateFinished")
        .addBoolean("assessment2Reached")
        .addString("assessment2ProgressCondition")
        .addBoolean("assessment2Done")
        .addString("assessment2Key")

        //WashoutPeriod
        .addDate("washoutPeriodDateStarted")
        .addDate("washoutPeriodDateFinished")
        .addBoolean("washoutPeriodReached")
        .addString("washoutPeriodProgressCondition")
        .addBoolean("washoutPeriodDone")
        .addDate("washoutPeriodFinishingDate")

        //Assessment3
        .addDate("assessment3DateStarted")
        .addDate("assessment3DateFinished")
        .addBoolean("assessment3Reached")
        .addString("assessment3ProgressCondition")
        .addBoolean("assessment3Done")
        .addString("assessment3Key")

        //CueingMethod2
        .addDate("cueingMethod2DateStarted")
        .addDate("cueingMethod2DateFinished")
        .addBoolean("cueingMethod2Reached")
        .addString("cueingMethod2ProgressCondition")
        .addBoolean("cueingMethod2Done")
        .addDate("cueingMethod2FinishingDate")

        //Assessment4
        .addDate("assessment4DateStarted")
        .addDate("assessment4DateFinished")
        .addBoolean("assessment4Reached")
        .addString("assessment4ProgressCondition")
        .addBoolean("assessment4Done")
        .addString("assessment4Key")

        //PostStudy
        .addDate("postStudyDateFinished")
        .addBoolean("postStudyReached")
        .addString("postStudyProgressCondition")
        .addBoolean("postStudyDone")

        //NoStudy
        .addDate("noStudyDateStarted")

        //FreeLiving
        .addDate("freeLivingDateStarted")
        .addDate("freeLivingDateFinished")
        .addBoolean("freeLivingReached")
        .addString("freeLivingProgressCondition")
        .addBoolean("freeLivingDone")
        
   
        await schema.save({ useMasterKey: true });
    }
}

