'use strict';

/**
 * @ngdoc service
 * @name oncokbApp.reportItem
 * @description
 * # reportItem
 * Service in the oncokbApp.
 */
angular.module('oncokbApp')
    .service('reportItem', function () {
        var specialKeyChars = '#$%';
        function Item(geneName, mutation, tumorType){
            this.geneName = geneName || 'N/A';
            this.mutation = mutation || 'N/A';
            this.tumorType = tumorType || 'N/A';
            this.overallInterpretation = 'None.';
            this.alterType = 'Somatic Mutation';
            this.mutationFreq = 'N/A';
            this.tumorTypeDrugs = 'N/A';
            this.nonTumorTypeDrugs = 'N/A';
            this.hasClinicalTrial = 'N/A';
            this.treatment = 'None.';
            this.fdaApprovedInTumor = 'None.';
            this.fdaApprovedInOtherTumor = 'None.';
            this.clinicalTrials = 'None.';
            this.additionalInfo = 'None.';
        }

        function init(geneName, mutation, tumorType, annotation, relevantCancerType){
            var params = new Item(geneName, mutation, tumorType);
            var _clinicalTrail = constructClinicalTrial(annotation, geneName, mutation, tumorType, relevantCancerType);
            params.hasClinicalTrial = 'NO';
            if(_clinicalTrail.length > 0) {
                for(var i =0; i < _clinicalTrail.length; i++) {
                    if(_clinicalTrail[i].hasOwnProperty('CLINICAL TRIALS MATCHED FOR GENE AND DISEASE') &&
                        _clinicalTrail[i]['CLINICAL TRIALS MATCHED FOR GENE AND DISEASE'].length > 0) {
                        params.hasClinicalTrial = 'YES';
                        break;
                    }
                }
                params.clinicalTrials = _clinicalTrail;
            }else {
                params.clinicalTrials = 'None.';
            }

            if(params.hasClinicalTrial === 'NO') {
                annotation.annotation_summary = annotation.annotation_summary.toString().replace('Please refer to the clinical trials section.', '');
            }

            params.overallInterpretation = (geneName + ' ' + mutation + ' SUMMARY\n' +
            annotation.annotation_summary) || 'None.';
            //+ '\nOTHER GENES\nNo additional somatic mutations were detected in this patient sample in the other sequenced gene regions.'
            params.geneName = geneName;
            params.mutation = mutation;
            params.diagnosis = tumorType;
            params.tumorTissueType = params.diagnosis;
            var _treatment = constructTreatment(annotation, geneName, mutation, tumorType, relevantCancerType);
            params.treatment = _treatment.length > 0 ? _treatment : 'None.';

            var _fdaInfo = constructfdaInfo(annotation, geneName, mutation, tumorType, relevantCancerType);
            if(_fdaInfo.approved.length > 0) {
                params.tumorTypeDrugs = 'YES';
                params.fdaApprovedInTumor = _fdaInfo.approved;
            }else {
                params.tumorTypeDrugs = 'NO';
                params.fdaApprovedInTumor = 'None.';
            }
            if(_fdaInfo.approvedInOther.length > 0) {
                params.nonTumorTypeDrugs = 'YES';
                params.fdaApprovedInOtherTumor = _fdaInfo.approvedInOther;
            }else {
                params.nonTumorTypeDrugs = 'NO';
                params.fdaApprovedInOtherTumor = 'None.';
            }

            var _additionalInfo = constructAdditionalInfo(annotation, geneName, mutation, tumorType, relevantCancerType);
            params.additionalInfo = _additionalInfo.length > 0 ? _additionalInfo : 'None.';

            //Set the mutation type to MUTATION, need to change after type available
            params.alterType = 'Somatic Mutation';
            return params;
        }

        // function getData(){
        //   var keys = ['overallInterpretation','geneName','mutation','alterType',
        //   'mutationFreq','tumorTypeDrugs','nonTumorTypeDrugs','hasClinicalTrial',
        //   'treatment','fdaApprovedInTumor','fdaApprovedInOtherTumor',
        //   'clinicalTrials','additionalInfo'];
        //   var value = {};

        //   for(var i = 0 ; i < keys.length; i++) {
        //     value[keys[i]] = this[keys[i]];
        //   }
        //   return value;
        // };

        function constructTreatment(annotation, geneName, mutation, tumorType, relevantCancerType) {
            var treatment = [],
                key = '',
                value = [],
                object = {},
                cancerTypeInfo = relevantCancerType || {},
                description = '';

            if(annotation.annotation_summary) {
                key = geneName + ' ' + mutation + ' SUMMARY';
                value.push({'description': annotation.annotation_summary});
                object[key] = value;
                treatment.push(object);
            }

            if(cancerTypeInfo.nccn_guidelines) {
                var _datum = cancerTypeInfo.nccn_guidelines;
                var _datumL = _datum.length;
                var i;
                var versions = {};

                value = [];
                object = {};
                key = 'NCCN GUIDELINES';
                for(i=0; i < _datumL; i++) {
                    if(!versions.hasOwnProperty(_datum[i].version)) {
                        versions[_datum[i].version] = {};
                    }
                    if(checkDescription(_datum[i])) {
                        versions[_datum[i].version]['recommendation category'] = _datum[i].description;
                    }
                }

                for(var versionKey in versions) {
                    var version = versions[versionKey];
                    version.nccn_special = 'Version: ' + versionKey + ', Cancer type: ' + tumorType;
                    value.push(version);
                }

                object[key] = value;
                treatment.push(object);
            }

            if(cancerTypeInfo.standard_therapeutic_implications) {
                object = {};

                //Add standard therapy implication description
                if(cancerTypeInfo.standard_therapeutic_implications.general_statement && cancerTypeInfo.standard_therapeutic_implications.general_statement.sensitivity){
                    if(!angular.isArray(cancerTypeInfo.standard_therapeutic_implications.general_statement.sensitivity)) {
                        description = cancerTypeInfo.standard_therapeutic_implications.general_statement.sensitivity.description;
                    }else{
                        description = "NOTICE: Found multiple general statements.";
                    }
                    value = [];
                    key = 'STANDARD THERAPEUTIC IMPLICATIONS';
                    if(typeof description === 'string') {
                        description = description.trim();
                    }
                    value.push({'description': description});
                    object[key] = value;
                }else if(cancerTypeInfo.standard_therapeutic_implications.resistant_to){
                    //If cancer type does not have description but resistant to treatments, the header
                    //should also be added

                    object['STANDARD THERAPEUTIC IMPLICATIONS'] = [];
                    treatment.push(object);
                }

                if(cancerTypeInfo.standard_therapeutic_implications.resistant_to) {
                    var _datum = cancerTypeInfo.standard_therapeutic_implications.resistant_to;

                    object = {};
                    object = findByLevelEvidence(_datum, object, '', '', ' (Resistance)');

                    for(var _key in object) {
                        var _object = {},
                            _newKey = _key.replace(specialKeyChars, '');
                        _object[_newKey] = object[_key];
                        treatment.push(_object);
                        _object = null;
                    }
                }
            }

            if(cancerTypeInfo.prognostic_implications && checkDescription(cancerTypeInfo.prognostic_implications)) {
                description = cancerTypeInfo.prognostic_implications.description;
                value = [];
                key = 'PROGNOSTIC IMPLICATIONS';
                object = {};
                if(angular.isString(description)) {
                    description = description.trim();
                }else {
                    if(angular.isArray(description)){
                        var str = [];
                        description.forEach(function(e){
                            if(e['Cancer type'].toString().toLowerCase() === 'all tumors' && str.length > 0) {
                                str.unshift(e.value.toString().trim());
                            }else {
                                str.push(e.value.toString().trim());
                            }
                        });
                        description = str.join(' ');
                    }else{
                        description = '';
                        console.log('PROGNOSTIC IMPLICATIONS --- not string --- not array');
                    }
                }
                value.push({'description': description});
                object[key] = value;
                treatment.push(object);
            }

            return treatment;
        }

        function findApprovedDrug(datum, object, tumorType, key, valueExtend) {
            for(var m=0, datumL = datum.length; m < datumL; m++) {
                var _subDatum = datum[m],
                    _key = '',
                    _obj = {},
                    _level;

                if(typeof key !== 'undefined') {
                    _key = key;
                }

                if(_subDatum.treatment) {
                    for (var i = 0; i < _subDatum.treatment.length; i++) {
                        var _treatment = _subDatum.treatment[i];
                        if(_treatment.drug) {
                            for (var j = 0; j < _treatment.drug.length; j++) {
                                var _drug = _treatment.drug[j];
                                if(_drug.fda_approved === 'Yes') {
                                    _key+=_drug.name + ' + ';
                                }
                            }
                        }
                        _key = _key.substr(0, _key.length-3);
                        _key += ', ';
                    }
                }

                _key = _key.substr(0, _key.length-2);

                if(valueExtend !== undefined) {
                    _key += valueExtend;
                }

                while(object.hasOwnProperty(_key)) {
                    _key+=specialKeyChars;
                }

                if(_subDatum.level_of_evidence_for_patient_indication && _subDatum.level_of_evidence_for_patient_indication.level) {
                    _level = _subDatum.level_of_evidence_for_patient_indication.level;
                    _obj['Level of evidence'] = isNaN(_level)?_level.toUpperCase():_level;
                }
                if(checkDescription(_subDatum)) {
                    _obj.description = _subDatum.description;
                }
                if(typeof tumorType !== 'undefined' && tumorType !== '') {
                    _obj['Cancer Type']= tumorType;
                }
                object[_key] = [_obj];
            }

            return object;
        }

        function findByLevelEvidence(datum, object, tumorType, key, valueExtend) {
            for(var m=0, datumL = datum.length; m < datumL; m++) {
                var _subDatum = datum[m],
                    _key = '',
                    _obj = {},
                    _level;

                if(typeof key !== 'undefined') {
                    _key = key;
                }

                if(_subDatum.treatment) {
                    for (var i = 0; i < _subDatum.treatment.length; i++) {
                        var _treatment = _subDatum.treatment[i];
                        if(_treatment.drug) {
                            for (var j = 0; j < _treatment.drug.length; j++) {
                                var _drug = _treatment.drug[j];
                                _key+=_drug.name + ' + ';
                            }
                        }

                        _key = _key.substr(0, _key.length-3);
                        _key += ', ';
                    }
                }

                _key = _key.substr(0, _key.length-2);

                if(valueExtend !== undefined) {
                    _key += valueExtend;
                }

                while(object.hasOwnProperty(_key)) {
                    _key+=specialKeyChars;
                }

                if(_subDatum.level_of_evidence_for_patient_indication && _subDatum.level_of_evidence_for_patient_indication.level) {
                    _level = _subDatum.level_of_evidence_for_patient_indication.level;
                    _obj['Level of evidence'] = isNaN(_level)?_level.toUpperCase():_level;
                }
                if(checkDescription(_subDatum)) {
                    _obj.description = _subDatum.description;
                }
                if(typeof tumorType !== 'undefined' && tumorType !== '') {
                    _obj['Cancer Type']= tumorType;
                }
                object[_key] = [_obj];
            }
            return object;
        }

        function displayProcess(str) {
            var specialUpperCasesWords = ['NCCN'];
            var specialLowerCasesWords = ['of', 'for', 'to'];

            str = str.replace(/_/g, ' ');
            str = str.replace(
                /\w\S*/g,
                function(txt) {
                    var _upperCase = txt.toUpperCase(),
                        _lowerCase = txt.toLowerCase();

                    if( specialUpperCasesWords.indexOf(_upperCase) !== -1 ) {
                        return _upperCase;
                    }

                    if( specialLowerCasesWords.indexOf(_lowerCase) !== -1 ) {
                        return _lowerCase;
                    }

                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
            return str;
        }

        function constructfdaInfo(annotation, geneName, mutation, tumorType, relevantCancerType) {
            var fdaApproved = [],
                fdaApprovedInOther = [],
                object = {},
                cancerTypeInfo = relevantCancerType || {},
                attrsToDisplay = ['sensitive_to', 'resistant_to'],
                i =0;

            if(cancerTypeInfo.standard_therapeutic_implications) {
                for (i = 0; i < attrsToDisplay.length; i++) {
                    if(cancerTypeInfo.standard_therapeutic_implications[attrsToDisplay[i]]) {
                        var _datum = cancerTypeInfo.standard_therapeutic_implications[attrsToDisplay[i]];

                        object = {};
                        if(attrsToDisplay[i] === 'sensitive_to') {
                            object = findApprovedDrug(_datum, object);
                        }

                        for(var _key in object) {
                            var _object = {},
                                _newKey = _key.replace(specialKeyChars, '');
                            _object[_newKey] = object[_key];
                            fdaApproved.push(_object);
                            _object = null;
                        }
                    }
                }
            }

            if(annotation.cancer_type && relevantCancerType && relevantCancerType.$type) {
                object = {};

                for (i = 0; i < annotation.cancer_type.length; i++) {
                    if(isNRCT(relevantCancerType.$type, annotation.cancer_type[i].$type)) {
                        if(annotation.cancer_type[i].standard_therapeutic_implications) {
                            for (var j = 0; j < attrsToDisplay.length; j++) {
                                if(annotation.cancer_type[i].standard_therapeutic_implications[attrsToDisplay[j]]) {
                                    /* jshint -W004 */
                                    var _datum = annotation.cancer_type[i].standard_therapeutic_implications[attrsToDisplay[j]];
                                    if(attrsToDisplay[j] === 'sensitive_to') {
                                        object = findApprovedDrug(_datum, object, annotation.cancer_type[i].$type);
                                    }
                                    /* jshint +W004 */
                                }
                            }
                        }
                    }
                }

                /* jshint -W004 */
                for(var _key in object) {
                    var _object = {},
                        _newKey = _key.replace(specialKeyChars, '');
                    _object[_newKey] = object[_key];

                    for(i = 0; i < _object[_newKey].length; i++ ) {
                        delete _object[_newKey][i]['Level of evidence'];
                        delete _object[_newKey][i].description;
                    }

                    fdaApprovedInOther.push(_object);
                    _object = null;
                }
                /* jshint +W004 */
            }
            return {'approved': fdaApproved, 'approvedInOther': fdaApprovedInOther};
        }

        //Is not relevant cancer type
        function isNRCT(relevent, type) {
            if(typeof relevent === 'object') {
                if(relevent instanceof Array) {
                    for(var i=0; i<relevent.length; i++) {
                        if(relevent[i]['Cancer type'] === type) {
                            return false;
                        }
                    }
                    return true;
                }else {
                    if(relevent.type === type) {
                        return false;
                    }else {
                        return true;
                    }
                }
            }else {
                return null;
            }
        }

        function constructEmptyTreatmentStatment(gene, alteration, tumorType) {
            var geneName = gene.toString().trim().toUpperCase();
            var alterationName = alteration.toString().trim();
            var tumorTypeName = tumorType.toString().trim();

            var statement = 'There are no investigational therapies for ';
            var info = [];

            if(alterationName.toLowerCase().indexOf('amplification') !== -1) {
                info.push(geneName);
                info.push('amplified');
                info.push(tumorTypeName);
            }else if(alterationName.toLowerCase().indexOf('deletion') !== -1) {
                info.push(geneName);
                info.push('deleted');
                info.push(tumorTypeName);
            }else if (alterationName.toLowerCase().indexOf('fusion') !== -1) {
                info.push(tumorTypeName);
                info.push('with');
                info.push(alterationName);
            }else{
                info.push(geneName);
                info.push(alterationName);
                info.push('mutant');
                info.push(tumorTypeName);
            }

            statement += info.join(' ');

            return statement;
        }

        function constructClinicalTrial(annotation, geneName, mutation, tumorType, relevantCancerType) {
            var clinicalTrials = [],
                key = '',
                value = [],
                object = {},
                cancerTypeInfo = relevantCancerType || {},
                attrsToDisplay = ['resistant_to', 'sensitive_to'];

            if(cancerTypeInfo.clinical_trial) {
                var _datum=[];

                if(angular.isArray(cancerTypeInfo.clinical_trial)){
                    _datum = cancerTypeInfo.clinical_trial;
                }else{
                    _datum.push(cancerTypeInfo.clinical_trial);
                }
                value = [];
                object = {};
                key = 'CLINICAL TRIALS MATCHED FOR GENE AND DISEASE';

                for(var i=0, _datumL = _datum.length; i < _datumL; i++) {
                    var _subDatum = {},
                        _phase = _datum[i].phase || '';

                    if(_phase.indexOf('/') !== -1 && _phase !== 'N/A') {
                        var _phases = _phase.split('/');
                        /* jshint -W083 */
                        _phases.forEach(function(e, i, array){
                            array[i] = e.replace(/phase/gi, '').trim();
                        });
                        /* jshint +W083 */
                        _phase = 'Phase ' + _phases.sort().join('/');
                    }
                    _subDatum.trial = _datum[i].trial_id + (_phase!==''?(', ' + _phase):'');
                    _subDatum.title = _datum[i].title;
                    if(checkDescription(_subDatum)) {
                        _subDatum.description = removeCharsInDescription(_datum[i].description);
                    }
                    value.push(_subDatum);
                }

                object[key] = value;
                clinicalTrials.push(object);
            }

            if(cancerTypeInfo.investigational_therapeutic_implications) {
                var hasdrugs = false,
                    emptyTreatmentStatement = constructEmptyTreatmentStatment(geneName, mutation, tumorType);

                if(cancerTypeInfo.investigational_therapeutic_implications.general_statement && cancerTypeInfo.investigational_therapeutic_implications.general_statement.sensitivity) {
                    var description;
                    value = [];
                    object = {};
                    key = 'INVESTIGATIONAL THERAPEUTIC IMPLICATIONS';
                    if(!angular.isArray(cancerTypeInfo.investigational_therapeutic_implications.general_statement.sensitivity)) {
                        description = cancerTypeInfo.investigational_therapeutic_implications.general_statement.sensitivity.description;
                    }else{
                        description = "NOTICE: Found multiple general statements.";
                    }
                    object[key] = addRecord({'array': ['Cancer type', 'value'], 'object':'description'}, description, value);

                    clinicalTrials.push(object);
                }else if(Object.keys(cancerTypeInfo.investigational_therapeutic_implications).length > 0){
                    clinicalTrials.push({'INVESTIGATIONAL THERAPEUTIC IMPLICATIONS': []});
                }

                for (var j = 0; j < attrsToDisplay.length; j++) {
                    if(cancerTypeInfo.investigational_therapeutic_implications[attrsToDisplay[j]]) {
                        object = {};
                        if(attrsToDisplay[j] === 'sensitive_to') {
                            object = findByLevelEvidence(cancerTypeInfo.investigational_therapeutic_implications[attrsToDisplay[j]], object);
                        }else if(attrsToDisplay[j] === 'resistant_to'){
                            object = findByLevelEvidence(cancerTypeInfo.investigational_therapeutic_implications[attrsToDisplay[j]], object, '', '', ' (Resistance)');
                        }else {
                            object = findByLevelEvidence(cancerTypeInfo.investigational_therapeutic_implications[attrsToDisplay[j]], object, '', displayProcess(attrsToDisplay[j]) + ': ');
                        }
                        if(Object.keys(object).length > 0) {
                            hasdrugs = true;
                        }
                        for(var _key in object) {
                            var _object = {},
                                _newKey = _key.replace(specialKeyChars, '');
                            _object[_newKey] = object[_key];
                            clinicalTrials.push(_object);
                            _object = null;
                        }
                    }
                }

                if(!hasdrugs) {
                    if(!cancerTypeInfo.investigational_therapeutic_implications.general_statement) {
                        value = [];
                        object = {};
                        key = 'INVESTIGATIONAL THERAPEUTIC IMPLICATIONS';
                        value.push({'description': emptyTreatmentStatement});
                        object[key] = value;
                        clinicalTrials.push(object);
                    }else {
                        clinicalTrials.push(emptyTreatmentStatement);
                    }
                }

                object = {};
                key = 'LEVELS OF EVIDENCE';
                value =  [
                    {'Level 1': 'FDA-approved biomarker and drug association in this indication.'},
                    {'Level 2A': 'FDA-approved biomarker and drug association in another indication, and NCCN-compendium listed for this indication.'},
                    {'Level 2B': 'FDA-approved biomarker in another indication, but not FDA or NCCN-compendium-listed for this indication.'},
                    {'Level 3': 'Clinical evidence links this biomarker to drug response but no FDA-approved or NCCN compendium-listed biomarker and drug association.'},
                    {'Level 4': 'Preclinical evidence potentially links this biomarker to response but no FDA-approved or NCCN compendium-listed biomarker and drug association.'},
                    {'Level R1': 'NCCN-compendium listed biomarker for resistance to a FDA-approved drug.'},
                    {'Level R2': 'Not NCCN compendium-listed biomarker, but clinical evidence linking this biomarker to drug resistance.'},

                ];
                object[key] = value;
                clinicalTrials.push(object);
            }
            return clinicalTrials;
        }

        function addRecord(keys, value, array) {
            if(Array.isArray(value)) {
                value.forEach(function(e) {
                    var _obj = {};
                    keys.array.forEach(function(e1) {
                        _obj[e1] = removeCharsInDescription(e[e1]);
                    });
                    array.push(_obj);
                });
            }else {
                var _obj = {};
                _obj[keys.object] = removeCharsInDescription(value);
                array.push(_obj);
            }
            return array;
        }

        function checkDescription(datum) {
            if(datum && datum.hasOwnProperty('description') && (angular.isString(datum.description) || datum.description instanceof Array)) {
                return true;
            }else {
                return false;
            }
        }

        function constructAdditionalInfo(annotation, geneName, mutation, tumorType, relevantCancerType) {
            var additionalInfo = [],
                key = '',
                value = [],
                object = {},
                cancerTypeInfo = relevantCancerType || {};

            if(annotation.gene_annotation && checkDescription(annotation.gene_annotation)) {
                value = [];
                key = 'BACKGROUND';
                object = {};
                value.push({'description': removeCharsInDescription(annotation.gene_annotation.description)});
                object[key] = value;
                additionalInfo.push(object);
            }

            if(cancerTypeInfo.prevalence) {
                var targetValue = cancerTypeInfo.prevalence.description;

                value = [];
                key = 'MUTATION PREVALENCE';
                object = {};

                //Show all tumor info first
                if(angular.isArray(cancerTypeInfo.prevalence.description)){
                    var alltumor;
                    targetValue = [];

                    for(var i = 0; i < cancerTypeInfo.prevalence.description.length ; i++) {
                        if(cancerTypeInfo.prevalence.description[i].hasOwnProperty('Cancer type') && /all tumor/ig.test(cancerTypeInfo.prevalence.description[i]['Cancer type'].toString().toLowerCase())){
                            alltumor = cancerTypeInfo.prevalence.description[i];
                            cancerTypeInfo.prevalence.description.splice(i);
                        }
                    }

                    if(alltumor){
                        cancerTypeInfo.prevalence.description.unshift(alltumor);
                    }

                    cancerTypeInfo.prevalence.description.forEach(function(e){
                        if(e.hasOwnProperty('value')){
                            targetValue.push(e.value);
                        }
                    });

                    targetValue = targetValue.join(' ');
                }

                object[key] = addRecord({'array': ['Cancer type', 'value'], 'object':'description'}, targetValue, value);

                additionalInfo.push(object);
            }

            if(annotation.variant_effect) {
                if(angular.isObject(annotation.variant_effect)) {
                    if(angular.isArray(annotation.variant_effect)){
                        annotation.variant_effect.forEach(function(effect){
                            object = getMutationEffect(effect);

                            if(object){
                                additionalInfo.push(object);
                            }
                        });
                    }else{
                        object = getMutationEffect(annotation.variant_effect);

                        if(object){
                            additionalInfo.push(object);
                        }
                    }
                }
            }
            return additionalInfo;
        }

        function getMutationEffect(variant_effect){
            var key = 'MUTATION EFFECT';
            var object = {};
            var value = [];

            if(angular.isObject(variant_effect) && !angular.isArray(variant_effect)) {
                value.push({
                    'effect': variant_effect.effect || '',
                    'description': variant_effect.description? removeCharsInDescription(variant_effect.description) : ''
                });
                object[key] = value;
                return object;
            }else {
                return false;
            }
        }

        function removeCharsInDescription(str) {
            if(typeof str !== 'undefined') {
                str = str.trim();
                str = str.replace(/(\r\n|\n|\r)/gm,'');
                str = str.replace(/(\s\s*)/g,' ');
                return str;
            }else {
                return '';
            }
        }
        // Public API here
        return {
            init: init
        };

    });
