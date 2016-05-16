'use strict';

/**
 * @ngdoc function
 * @name oncokb.controller:GeneCtrl
 * @description
 * # GeneCtrl
 * Controller of the oncokb
 */
angular.module('oncokbApp')
    .controller('GenesCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$routeParams', '_', 'config', 'importer', 'storage', 'documents', 'users', 'DTColumnDefBuilder', 'DTOptionsBuilder', 'DatabaseConnector', 'OncoKB',
        function ($scope, $rootScope, $location, $timeout, $routeParams, _, config, importer, storage, Documents, users, DTColumnDefBuilder, DTOptionsBuilder, DatabaseConnector, OncoKB) {
            function saveGene(docs, docIndex, excludeObsolete, callback) {
                if (docIndex < docs.length) {
                    var fileId = docs[docIndex].id;
                    storage.getRealtimeDocument(fileId).then(function (realtime) {
                        if (realtime && realtime.error) {
                            console.log('did not get realtime document.');
                        } else {
                            console.log(docs[docIndex].title, '\t\t', docIndex);
                            console.log('\t copying');
                            var gene = realtime.getModel().getRoot().get('gene');
                            var vus = realtime.getModel().getRoot().get('vus');
                            if (gene) {
                                var geneData = importer.getGeneData(gene, excludeObsolete);
                                var vusData = importer.getVUSData(vus);
                                var params = {};

                                if(geneData) {
                                    params.gene = JSON.stringify(geneData);
                                }
                                if(vusData) {
                                    params.vus = JSON.stringify(vusData);
                                }
                                DatabaseConnector.updateGene(params,
                                    function (result) {
                                        console.log('\t success', result);
                                        $timeout(function () {
                                            saveGene(docs, ++docIndex, excludeObsolete, callback);
                                        }, 200, false);
                                    },
                                    function (result) {
                                        console.log('\t failed', result);
                                        $timeout(function () {
                                            saveGene(docs, ++docIndex, excludeObsolete, callback);
                                        }, 200, false);
                                    }
                                );
                            } else {
                                console.log('\t\tNo gene model.');
                                $timeout(function () {
                                    saveGene(docs, ++docIndex, excludeObsolete, callback);
                                }, 200, false);
                            }
                        }
                    });
                } else {
                    if (callback) {
                        callback();
                    }
                    console.log('finished.');
                }
            }

            $scope.showDocs = function () {
                $scope.documents.forEach(function (item) {
                    console.log(item.title);
                })
                //console.log($scope.documents);
            };

            $scope.getDocs = function () {
                var docs = Documents.get();
                if (docs.length > 0) {
                    // $scope.$apply(function() {
                    $scope.documents = Documents.get();
                    $scope.status.rendering = false;
                    // });
                } else {
                    if (OncoKB.global.genes) {
                        storage.requireAuth(true).then(function () {
                            storage.retrieveAllFiles().then(function (result) {
                                Documents.set(result);
                                Documents.setStatus(OncoKB.global.genes);
                                $scope.documents = Documents.get();
                                $scope.status.rendering = false;
                                // loading_screen.finish();
                            });
                        });
                    } else {
                        DatabaseConnector.getAllGene(function (data) {
                            OncoKB.global.genes = data;
                            storage.requireAuth(true).then(function () {
                                storage.retrieveAllFiles().then(function (result) {
                                    Documents.set(result);
                                    Documents.setStatus(OncoKB.global.genes);
                                    $scope.documents = Documents.get();
                                    $scope.status.rendering = false;
                                });
                            });
                        });
                    }
                }
            };

            $scope.backup = function () {
                $scope.status.backup = false;
                importer.backup(function () {
                    $scope.status.backup = true;
                });
            };

            $scope.redirect = function (path) {
                $location.path(path);
            };

            $scope.checkError = function () {
                console.log($rootScope.errors);
            };

            $scope.saveAllGenes = function () {
                $scope.status.saveAllGenes = false;
                saveGene($scope.documents, 0, true, function () {
                    $scope.status.saveAllGenes = true;
                });
            };

            $scope.userRole = users.getMe().role;

            var sorting = [[5, 'desc'], [1, 'asc'], [0, 'asc']];
            if (users.getMe().role === 8) {
                sorting = [[4, 'desc'], [1, 'asc'], [0, 'asc']];
            }

            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withDOM('ifrtlp')
                .withOption('order', sorting)
                .withBootstrap();

            $scope.dtColumns = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2).notSortable(),
                DTColumnDefBuilder.newColumnDef(3).notSortable(),
                DTColumnDefBuilder.newColumnDef(4),
                DTColumnDefBuilder.newColumnDef(5),
                DTColumnDefBuilder.newColumnDef(6)
            ];
            $scope.status = {
                backup: true,
                saveAllGenes: true,
                migrate: true,
                rendering: true
            };
            $scope.adminEmails = [];
            $scope.getDocs();
            $scope.oncoTree = {
                mainTypes: {}
            };
            $scope.tumorTypes = {
                "Activated -B-cell-like Diffuse Large B-cell Lymphoma (ABC-DLBCL)": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Actue Lymphoblastic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Lymphoblastic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Lymphocytic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Lymphoid Leukemia, Acute Myeloid Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Myelogenous Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Myeloid Leukemia (AML)": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Myeloid Leukemia, Acute Lymphoblastic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Acute promyelocytic leukemia (APL)": {
                    "oncotree_main":"Leukemia"
                },
                "Adrenocortical Carcinoma": {
                    "oncotree_main":"Adrenocortical Carcinoma"
                },
                "Advanced Solid Tumors": {
                    "oncotree_main":"All solid tumors"
                },
                "All Solid Tumors": {
                    "oncotree_main":"All solid tumors"
                },
                "All Tumor Types": {
                    "oncotree_main":"All tumors"
                },
                "All Tumors": {
                    "oncotree_main":"All tumors"
                },
                "All Types": {
                    "oncotree_main":"All tumors"
                },
                "Anaplastic Glioma, Glioblastoma": {
                    "oncotree_main":"Glioma"
                },
                "Anaplastic Thyroid Cancer": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Angiomatoid Fibrous Histiocytoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Angiosarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Angiosarcomas": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Astrocytomas": {
                    "oncotree_main":"Glioma"
                },
                "Atypical Teratoid/Rhabdoid Tumors (AT/RT)": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "B-cell lymphocytosis": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Basal Cell Carcinoma": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "Biliary Cancer": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "Brain Tumors": {
                    "oncotree_main":"Gliomas"
                },
                "Breast Carcinoma": {
                    "oncotree_main":"Breast Carcinoma"
                },
                "Breast Carcinoma, Ovarian Cancer": {
                    "oncotree_main":"Breast Carcinoma, Ovarian Cancer"
                },
                "Breast Fibroadenoma": {
                    "oncotree_main":"Breast Carcinoma"
                },
                "Burkitt Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Burkitt's Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Cancer of Unknown Primary (See Occult Primary)-Midline Carcinomas": {
                    "oncotree_main":"Cancer of Unknown Primary"
                },
                "Cervical Carcinoma": {
                    "oncotree_main":"Cervical Cancer"
                },
                "Childhood B cell lineage ALL": {
                    "oncotree_main":"Leukemia"
                },
                "Childhood Brain Tumor (Astrocytoma)": {
                    "oncotree_main":"Glioma"
                },
                "Childhood Leukemias": {
                    "oncotree_main":"Leukemia"
                },
                "Childhood Myelodysplastic Syndrome": {
                    "oncotree_main":"Myelodysplasia"
                },
                "Chilhood Brain Tumor (Astrocytoma)": {
                    "oncotree_main":"Glioma"
                },
                "cholangiocarcinoma": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "Chronic Eosinophilic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Chronic Lymphocytic Leukemia (CLL)": {
                    "oncotree_main":"Leukemia"
                },
                "Chronic Myelogenous Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Chronic Myeloid Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Clear Cell Renal Cell Carcinoma": {
                    "oncotree_main":"Renal Cell Carcinoma"
                },
                "Clear Cell Sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Colon Cancer": {
                    "oncotree_main":"Colorectal Cancer"
                },
                "Congenital Fibrosarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Congenital Mesoblastic Nephroma": {
                    "oncotree_main":"Renal Cell Carcinoma"
                },
                "Desmoplastic Small Round Cell Tumor": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Differentiated Thyroid Cancer": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Diffuse Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Diffuse Intrinsic Pontine Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Diffuse Large B Cell Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Diffuse Large B Cell Lymphoma (DLBCL)": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "DIFFUSE LARGE B-CELL LYMPHOMA": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Diffuse Large B-Cell Lymphoma (DLBCL)": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Embryonal Rhabdomyosarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Encapsulated Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Endometrial Cancer": {
                    "oncotree_main":"Endometrial Cancer"
                },
                "Endometrial stromal sarcoma": {
                    "oncotree_main":"Uterine Sarcoma"
                },
                "Epithelioid Sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Erdheim-Chester Disease": {
                    "oncotree_main":"Histiocytosis"
                },
                "Esophageal Adenocarcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Esophageal and Gastric adenocarcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Esophageal Cancer": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Esophageal Carcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Esophageal Squamous Carcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Esophagogastric Cancer": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Esophagogastric Carcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Ewing Sarcoma": {
                    "oncotree_main":"Bone Cancer"
                },
                "Ewing Sarcoma, Acute Myelogenous Leukemia": {
                    "oncotree_main":"Bone Cancer, Leukemia"
                },
                "Ewing-like small round cell sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Extraskeletal Myxoid Chondrosarcoma": {
                    "oncotree_main":"Bone Cancer"
                },
                "Fallopian Tube Carcinoma": {
                    "oncotree_main":"Ovarian Cancer"
                },
                "Follicular Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Gastric Adenocarcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Gastric Carcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Gastric Tumors": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Gastroesophageal junction carcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Gastrointestinal Neuroendocrine Tumor": {
                    "oncotree_main":"Gastrointestinal Neuroendocrine Tumor"
                },
                "Gastrointestinal Tumor": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Germ Cell Tumor": {
                    "oncotree_main":"Germ Cell Tumor"
                },
                "Giant Cell Tumor of the Bone": {
                    "oncotree_main":"Bone Cancer"
                },
                "Glioblastoma Multiforme": {
                    "oncotree_main":"Glioma"
                },
                "Glioblastomas": {
                    "oncotree_main":"Glioma"
                },
                "Glioma/Glioblastoma": {
                    "oncotree_main":"Glioma"
                },
                "Granulosa Cell Tumor (Male)": {
                    "oncotree_main":"Sex Cord Stromal Tumor"
                },
                "Haematological malignancies": {
                    "oncotree_main":"All liquid tumors"
                },
                "Head and Neck Cancers": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Head and Neck Carcinoma": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Hematologic Malignancies": {
                    "oncotree_main":"All liquid tumors"
                },
                "Hematological Malignancies": {
                    "oncotree_main":"All liquid tumors"
                },
                "Hepatocellular Adenoma": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "High Grade Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Hypereosinophilic Syndrome": {
                    "oncotree_main":"Liquid tumor"
                },
                "Hypereosinophilic syndrome, Chronic Eosinophilic Leukemia": {
                    "oncotree_main":"Liquid tumor"
                },
                "Inflammatory Myofibroblastic Tumors": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Intimal sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Invasive Mucinous Lung Adenocarcinoma": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Juvenile Myelomonocytic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Keratocystic Odontogenic Tumor": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Kidney Cancer": {
                    "oncotree_main":"Renal Cell Carcinoma"
                },
                "Langerhans cell histiocytosis": {
                    "oncotree_main":"Histiocytosis"
                },
                "Leiomyosarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Leukemia/Lymphoma": {
                    "oncotree_main":"Liquid tumor"
                },
                "Liposarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Low Grade Gliomas": {
                    "oncotree_main":"Glioma"
                },
                "Low-Grade Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Lung Adenocarcinoma": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Lymphoblastic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Lymphoma": {
                    "oncotree_main":"Too vague to map"
                },
                "Lymphomas": {
                    "oncotree_main":"Too vague to map"
                },
                "Malignant Gastrointestinal Neuroectodermal Tumor": {
                    "oncotree_main":"Not sure"
                },
                "Malignant gliomas": {
                    "oncotree_main":"Glioma"
                },
                "Malignant Melanoma": {
                    "oncotree_main":"Melanoma"
                },
                "Malignant peripheral nerve sheath tumors": {
                    "oncotree_main":"Nerve Sheath Tumor"
                },
                "Mantle Cell Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Medullary Thyroid Cancer": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Medullary Thyroid Carcinoma": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Medulloablastoma": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "Meningothelial Tumor": {
                    "oncotree_main":"CNS Cancer"
                },
                "Merkel cell carcinoma": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "Mesothelioma": {
                    "oncotree_main":"Mesothelioma"
                },
                "Multiple endocrine neoplasia": {
                    "oncotree_main":"Germline disposition"
                },
                "Myelodysplasia": {
                    "oncotree_main":"Myelodysplasia"
                },
                "Myelodysplastic Syndrome": {
                    "oncotree_main":"Myelodysplasia"
                },
                "Myelodysplastic Syndrome (MDS)": {
                    "oncotree_main":"Myelodysplasia"
                },
                "Myelodysplastic Syndromes": {
                    "oncotree_main":"Myelodysplasia"
                },
                "Myelofibrosis": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Myeloid Malignancies": {
                    "oncotree_main":"Liquid tumor"
                },
                "Myeloproliferative Neoplasm": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Myxoid Liposarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Non Small Cell Lung Cancer": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Non-Hodgkin's Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Non-small cell lung cancer (NSCLC)": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Non-Small Cell Lung Carcinoma": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "non-small lung cancer": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Oligodendroglioma": {
                    "oncotree_main":"Glioma"
                },
                "Oral cancer": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Ossifying fibromyxoid tumors (OFMT)": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Osteosarcoma": {
                    "oncotree_main":"Bone Cancer"
                },
                "Ovarian Granulosa Cell Tumor": {
                    "oncotree_main":"Sex Cord Stromal Tumor"
                },
                "Pancreatic Neuroendocrine Tumor": {
                    "oncotree_main":"Pancreatic Cancer"
                },
                "Papillary Thyroid Cancer": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Paragangliomas": {
                    "oncotree_main":"Miscellaneous Neuroepithelial Tumor"
                },
                "Parathyroid Adenoma": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Pediatric adrenocortical tumor": {
                    "oncotree_main":"Adrenocortical Carcinoma"
                },
                "Pediatric Glioblastoma": {
                    "oncotree_main":"Glioma"
                },
                "Pediatric High Grade Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Pediatric high-grade gliomas": {
                    "oncotree_main":"Glioma"
                },
                "Pheochromocytomas/Paragangliomas": {
                    "oncotree_main":"Pheochromocytoma,Miscellaneous Neuroepithelial Tumor"
                },
                "Phyllodes Tumor of Breast": {
                    "oncotree_main":"Breast Carcinoma"
                },
                "Pituitary Ademona": {
                    "oncotree_main":"Sellar Tumor"
                },
                "Pituitary Adenoma": {
                    "oncotree_main":"Sellar Tumor"
                },
                "Pontine Glioma": {
                    "oncotree_main":"Glioma"
                },
                "Primary Plasma Cell Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Primitive Neuroectodermal Tumor": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "Prolymphocytic leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Renal Cell Carcinomas": {
                    "oncotree_main":"Renal Cell Carcinoma"
                },
                "Retinoblastoma": {
                    "oncotree_main":"Retinoblastoma"
                },
                "Rhabdoid Tumors": {
                    "oncotree_main":"Wilms Tumor"
                },
                "Salivary Gland Cancer": {
                    "oncotree_main":"Salivary Carcinoma"
                },
                "Sarcoma": {
                    "oncotree_main":"Too vague to map"
                },
                "Sclerosing Rhabdomyosarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Secretory Breast Carcinoma": {
                    "oncotree_main":"Breast Carcinoma"
                },
                "Serous Ovarian Cancer": {
                    "oncotree_main":"Ovarian Cancer"
                },
                "Skin Cancer": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma OR Melanoma"
                },
                "Skin Cancer, Non-Melanoma": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "Small Cell Carcinoma of the Ovaries, Hyeprcalcemic Type": {
                    "oncotree_main":"Ovarian Cancer"
                },
                "Small Cell Carcinoma of the Ovaries, Hypercalcemic Type": {
                    "oncotree_main":"Ovarian Cancer"
                },
                "Small Cell Lung Cancer": {
                    "oncotree_main":"Small Cell Lung Cancer"
                },
                "SMALL CELL LUNG CARCINOMA": {
                    "oncotree_main":"Small Cell Lung Cancer"
                },
                "Small intestine neuroendocrine tumors": {
                    "oncotree_main":"Gastrointestinal Neuroendocrine Tumor"
                },
                "Small Round Cell Sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Soft Tissue Sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Solid Tumors": {
                    "oncotree_main":"All solid tumors"
                },
                "Spindle Cell Neoplasms": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Stomach Adenocarcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "T Cell Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "T-cell Acute Lymphoblastic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "T-cell acute lymphoblastic leukemia , T-cell lymphoma": {
                    "oncotree_main":"Leukemia,Non-Hodgkin Lymphoma"
                },
                "T-Cell Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Teratoma": {
                    "oncotree_main":"Germ Cell Tumor"
                },
                "Testicular cancer": {
                    "oncotree_main":"Too vague to map"
                },
                "Thymic Cancer": {
                    "oncotree_main":"Thymic Tumor"
                },
                "Thymic Epithelial Tumors": {
                    "oncotree_main":"Thymic Tumor"
                },
                "Thymic Tumor": {
                    "oncotree_main":"Thymic Tumor"
                },
                "Thyroid carcinoma": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Undifferentiated spindle-cell sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Urinary tract cancer": {
                    "oncotree_main":"Bladder Cancer"
                },
                "Urothelial Cancer": {
                    "oncotree_main":"Bladder Cancer"
                },
                "Urothelial Carcinoma of the Bladder": {
                    "oncotree_main":"Bladder Cancer"
                },
                "Urothelial/Bladder Carcinoma": {
                    "oncotree_main":"Bladder Cancer"
                },
                "Uterine Carcinoma": {
                    "oncotree_main":"Endometrial Cancer"
                },
                "Uterine Carcinosarcoma": {
                    "oncotree_main":"Endometrial Cancer"
                },
                "Uterine Leiomyoma": {
                    "oncotree_main":"Uterine Sarcoma"
                },
                "Uterine Leiomyosarcoma": {
                    "oncotree_main":"Uterine Sarcoma"
                },
                "Vestibular Schwannoma and Meningioma": {
                    "oncotree_main":"Nerve Sheath Tumor AND CNS Cancer"
                },
                "Wilms Tumor": {
                    "oncotree_main":"Wilms Tumor"
                },
                "Acute Lymphoblastic Leukemia (ALL)": {
                    "oncotree_main":"Leukemia"
                },
                "Acute Myeloid Leukemia, Myelodysplastic Syndromes, Myeloproliferative Neoplasms": {
                    "oncotree_main":"Leukemia/Myelodysplasia/Myeloproliferative Neoplasm"
                },
                "adenoid cystic carcinoma": {
                    "oncotree_main":"Salivary Carcinoma"
                },
                "Adrenal Carcinoma": {
                    "oncotree_main":"Adrenocortical Carcinoma"
                },
                "angioimmunoblastic t cell lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "anaplastic large cell lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "All tumors with wild-type p53": {
                    "oncotree_main":"Needs to be renamed"
                },
                "acute myeloid leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Angioma": {
                    "oncotree_main":"Too vague to map"
                },
                "b cell acute lymphoblastic leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "B-ALL (B-cell acute lymphoblastic leukemia)": {
                    "oncotree_main":"Leukemia"
                },
                "bladder cancer": {
                    "oncotree_main":"Bladder Cancer"
                },
                "bladder urothelial carcinoma": {
                    "oncotree_main":"Bladder Cancer"
                },
                "Brain Cancer": {
                    "oncotree_main":"Gliomas"
                },
                "breast cancer": {
                    "oncotree_main":"Breast Carcinoma"
                },
                "Breast Carcinoma, Prostate": {
                    "oncotree_main":"Breast Carcinoma"
                },
                "Cardio-facio-cutaneous syndrome": {
                    "oncotree_main":"Germline disposition"
                },
                "cervical cancer": {
                    "oncotree_main":"Cervical Cancer"
                },
                "Childhood Precursor B Cell Acute Lymphoid Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Chronic Myeloid Leukemia (CML)": {
                    "oncotree_main":"Leukemia"
                },
                "chondrosarcoma": {
                    "oncotree_main":"Bone Cancer"
                },
                "chronic lymphocytic leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "chronic myelomonocytic leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Colon Adenocarcinoma": {
                    "oncotree_main":"Colorectal Cancer"
                },
                "colorectal adenocarcinoma": {
                    "oncotree_main":"Colorectal Cancer"
                },
                "Colorectal Carcinoma": {
                    "oncotree_main":"Colorectal Cancer"
                },
                "colorectal cancer": {
                    "oncotree_main":"Colorectal Cancer"
                },
                "cutaneous squamous cell carcinoma": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "Dermatofibrosarcoma Protuberans": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "desmoid tumors": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Diffuse Large Cell B Cell Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "Duodenal Adenocarcinoma": {
                    "oncotree_main":"Small Bowel Cancer"
                },
                "Epedymoma": {
                    "oncotree_main":"CNS Cancer"
                },
                "Ependymoma": {
                    "oncotree_main":"CNS Cancer"
                },
                "Epitheloid haemangioendothelioma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Erdheim Chester Disease": {
                    "oncotree_main":"Histiocytosis"
                },
                "esophageal squamous cell carcinoma": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Essential Thrombocythemia": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Familial Pancreatic Cancer": {
                    "oncotree_main":"Pancreatic Cancer"
                },
                "Familial Platelet Disorder": {
                    "oncotree_main":"Leukemia"
                },
                "Familial Platelet Disorder with predisposition to AML (FPD/AML)": {
                    "oncotree_main":"Leukemia"
                },
                "Gallbladder Adenocarcinomas": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "gastric cancer": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Gastrointestinal Stromal Tumor (Thymic Cancer?)": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "glioblastoma": {
                    "oncotree_main":"Glioma"
                },
                "ovarian granulosa cell tumors": {
                    "oncotree_main":"Sex Cord Stromal Tumor"
                },
                "gastrointestinal stromal tumor": {
                    "oncotree_main":"Gastrointestinal Stromal Tumor"
                },
                "glioma": {
                    "oncotree_main":"Glioma"
                },
                "Glioma (Glioblastoma)": {
                    "oncotree_main":"Glioma"
                },
                "Glioma, Glioblastoma": {
                    "oncotree_main":"Glioma"
                },
                "GLIOMAS": {
                    "oncotree_main":"Glioma"
                },
                "hepatocellular carcinoma": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "hairy cell leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "head and neck cancer": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Head and Neck Squamous Cells Carcinoma": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Hematological Tumors": {
                    "oncotree_main":"Liquid tumor"
                },
                "Hematopoietic Malignancies": {
                    "oncotree_main":"Liquid tumor"
                },
                "Hepatocellular Cancer": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "Hereditary Non-polyposis Colorectal Cancer": {
                    "oncotree_main":"Colorectal Cancer"
                },
                "Histiocytic Neoplasm": {
                    "oncotree_main":"Histiocytic Disorder"
                },
                "head and neck squamous cell carcinoma": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Hodgkin Lymphoma": {
                    "oncotree_main":"Hodgkin Lymphoma"
                },
                "Hodgkin's Lymphoma": {
                    "oncotree_main":"Hodgkin Lymphoma"
                },
                "Hodgkin__�s Lymphoma": {
                    "oncotree_main":"Hodgkin Lymphoma"
                },
                "Hypopharyngeal Squamous Cell Cancer": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "inflammatory myofibroblastic tumor": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Invasive Endometroid Cancer": {
                    "oncotree_main":"Cervical Cancer"
                },
                "Kaposi Sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Large granular lymphocityc leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "Laryngeal Squamous Carcinoma": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "low grade glioma": {
                    "oncotree_main":"Glioma"
                },
                "liver cancer": {
                    "oncotree_main":"Hepatobiliary Cancer"
                },
                "lung cancer": {
                    "oncotree_main":"Too vague to map"
                },
                "Lung Kancer": {
                    "oncotree_main":"Too vague to map"
                },
                "lung squamous cell carcinoma": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Lymphoma, Leukemia": {
                    "oncotree_main":"Liquid tumor"
                },
                "Mast cell disorders": {
                    "oncotree_main":"Mastocytosis"
                },
                "Mast cell neoplasm": {
                    "oncotree_main":"Mastocytosis"
                },
                "Mast cell neoplasms": {
                    "oncotree_main":"Mastocytosis"
                },
                "Mastocytosis": {
                    "oncotree_main":"Mastocytosis"
                },
                "medulloblastoma": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "Meduloblastoma": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "meningioma": {
                    "oncotree_main":"CNS Cancer"
                },
                "Meningiomas": {
                    "oncotree_main":"CNS Cancer"
                },
                "multiple myeloma": {
                    "oncotree_main":"Multiple Myeloma"
                },
                "myeloproliferative neoplasms": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Myelodysplastic Syndrome/Myeloproliferative Disease (MDS/MPD)": {
                    "oncotree_main":"Myelodysplasia/Myeloproliferative Neoplasm"
                },
                "Myelodysplatic Syndrome/Myeloproliferative Disease (MDS/MPD)": {
                    "oncotree_main":"Myelodysplasia/Myeloproliferative Neoplasm"
                },
                "Myeloproliferative Hypereosinophilic Syndrome": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Myeloproliferative Neoplasm (PV, MF, ET)": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Nasopharyngeal Carcinoma": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "neuroblastoma": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "Neuroblastoma (small round blue cell tumors)": {
                    "oncotree_main":"Embryonal Tumor"
                },
                "Non Small Cel lung Cancer": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Non Small Cell Lung Carcinoma": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Non-Hodgkin__�s Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "non-small cell lung cancer": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "Oral Squamous Cell Carcinoma": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Oropharyngeal Squamous Cell Carcinoma (OSCC)": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "ovarian cancer": {
                    "oncotree_main":"Ovarian Cancer"
                },
                "pancreatic cancer": {
                    "oncotree_main":"Pancreatic Cancer"
                },
                "Pancreatic Ductal Carcinoma": {
                    "oncotree_main":"Pancreatic Cancer"
                },
                "Paraganglioma": {
                    "oncotree_main":"Miscellaneous Neuroepithelial Tumor"
                },
                "Parathyroid adenomas": {
                    "oncotree_main":"Head and Neck Carcinoma"
                },
                "Parotid Cancer": {
                    "oncotree_main":"Salivary Carcinoma"
                },
                "Pediatric Gliomas": {
                    "oncotree_main":"Glioma"
                },
                "Peritoneal Cancer": {
                    "oncotree_main":"Mesothelioma"
                },
                "Phaeochromacytoma": {
                    "oncotree_main":"Pheochromocytoma"
                },
                "pheochromocytoma": {
                    "oncotree_main":"Pheochromocytoma"
                },
                "Pilocytic Astrocytoma": {
                    "oncotree_main":"Glioma"
                },
                "pituitary tumors": {
                    "oncotree_main":"Sellar Tumor"
                },
                "pituitary adenomas": {
                    "oncotree_main":"Sellar Tumor"
                },
                "Polycythemia Vera": {
                    "oncotree_main":"Myeloproliferative Neoplasm"
                },
                "Primary Mediastinal Large B-cell Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                },
                "prostate cancer": {
                    "oncotree_main":"Prostate Cancer"
                },
                "Pulmonary Carcinoid": {
                    "oncotree_main":"Non-Small Cell Lung Cancer"
                },
                "renal cell carcinoma": {
                    "oncotree_main":"Renal Cell Carcinoma"
                },
                "rhabdomyosarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Salivary-Duct Cancer": {
                    "oncotree_main":"Salivary Carcinoma"
                },
                "Sarcoma Histocytosis": {
                    "oncotree_main":"Histiocytosis"
                },
                "skin basal cell carcinoma": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "melanoma": {
                    "oncotree_main":"Melanoma"
                },
                "Skin Cancer (Non-Melanoma)": {
                    "oncotree_main":"Skin Cancer, Non-Melanoma"
                },
                "Small-Cell Lung Cancer (SCLC)": {
                    "oncotree_main":"Small Cell Lung Cancer"
                },
                "Soft-Tissue Sarcoma": {
                    "oncotree_main":"Soft Tissue Sarcoma"
                },
                "Solid Tumors (Epithelial Cancers)": {
                    "oncotree_main":"All solid tumors"
                },
                "stomach cancer": {
                    "oncotree_main":"Esophagogastric Carcinoma"
                },
                "Stem cell leukemia, Lymphoma": {
                    "oncotree_main":"Liquid tumor"
                },
                "stem cell leukemia/lymphoma": {
                    "oncotree_main":"Liquid tumor"
                },
                "Subependymal Giant Cell Astrocytoma": {
                    "oncotree_main":"CNS Cancer"
                },
                "Subependymal Giant Cell Astrocytoma (Ependymomal Tumor)": {
                    "oncotree_main":"CNS Cancer"
                },
                "T cell acute lymphoblastic leukemia (T-ALL)": {
                    "oncotree_main":"Leukemia"
                },
                "t cell acute lymphoblastic leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "T-cell precursor acute lymphoblastic leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "T-Cell Prolymphocytic Leukemia": {
                    "oncotree_main":"Leukemia"
                },
                "thyroid cancer": {
                    "oncotree_main":"Thyroid Cancer"
                },
                "Therapy related Acute Myeloid Leukemia/Myelodysplastic Syndrome": {
                    "oncotree_main":"Leukemia/Myelodysplasia"
                },
                "thymic carcinoma": {
                    "oncotree_main":"Thymic Tumor"
                },
                "TP53 Wildtype Tumors": {
                    "oncotree_main":"Needs to be renamed"
                },
                "endometrial carcinoma": {
                    "oncotree_main":"Endometrial Cancer"
                },
                "uveal melanoma": {
                    "oncotree_main":"Melanoma"
                },
                "Urothelial Bladder Cancer": {
                    "oncotree_main":"Bladder Cancer"
                },
                "uterine cancer": {
                    "oncotree_main":"Uterine Sarcoma"
                },
                "Waldenstrom's Macroglobulinemia, Lymphoplasmayctic Lymphoma": {
                    "oncotree_main":"Non-Hodgkin Lymphoma"
                }
            };
            $scope.mappedTumorTypes = {};
            getCacheStatus();
            getAllMainTypes();

            var newGenes = [];

            $scope.migrate = function () {
                //console.log($scope.documents);
                $scope.status.migrate = false;
                importer
                    .migrate()
                    .then(function (result) {
                        if (result && result.error) {
                            $scope.status.migrate = true;
                        } else {
                            $scope.status.migrate = true;
                        }
                    });
            };

            $scope.create = function () {
                createDoc(0);
            };

            $scope.givePermission = function () {
                var testGene = {'test@gmail.com': '  AKT2, AKT3, ERBB3, FGFR1, ERBB2, FGFR3, ERBB4, FGFR2, FGFR4'};
                var genes = [];

                for (var key in testGene) {
                    /* jshint -W083 */
                    var _genes = testGene[key].trim().split(',').map(function (e) {
                        return e.trim();
                    });
                    _genes.forEach(function (_gene) {
                        if(_gene) {
                            genes.push({'email': key, 'gene': _gene});
                        }
                    });
                    /* jshint +W083 */
                }

                $scope.genesPermissions = genes;
                givePermissionSub(0);
            };

            function givePermissionSub(index) {
                if (index < $scope.genesPermissions.length) {
                    var genePermission = $scope.genesPermissions[index];
                    console.log(genePermission.gene, '\t', genePermission.email);
                    var _docs = Documents.get({title: genePermission.gene});
                    var _doc = _docs[0];
                    if (_doc && _doc.id) {
                        storage.requireAuth().then(function () {
                            storage.getPermission(_doc.id).then(function (result) {
                                if (result.items && angular.isArray(result.items)) {
                                    var permissionIndex = -1;
                                    result.items.forEach(function (permission, _index) {
                                        if (permission.emailAddress && permission.emailAddress === genePermission.email) {
                                            permissionIndex = _index;
                                        }
                                    });

                                    if (permissionIndex === -1) {
                                        storage.insertPermission(_doc.id, genePermission.email, 'user', 'writer').then(function (result) {
                                            if (result && result.error) {
                                                console.log('Error when insert permission.');
                                            } else {
                                                console.log('\tinsert writer to', genePermission.gene);
                                                $timeout(function () {
                                                    givePermissionSub(++index);
                                                }, 100);
                                            }
                                        });
                                    } else if (result.items[permissionIndex].role !== 'writer') {
                                        storage.updatePermission(_doc.id, result.items[permissionIndex].id, 'writer').then(function (result) {
                                            if (result && result.error) {
                                                console.log('Error when update permission.');
                                            } else {
                                                console.log('\tupdate  writer to', genePermission.gene);
                                                $timeout(function () {
                                                    givePermissionSub(++index);
                                                }, 100);
                                            }
                                        });
                                    }else {
                                        console.log('\tDont need to do anything on ', genePermission.email);
                                        $timeout(function () {
                                            givePermissionSub(++index);
                                        }, 100);
                                    }
                                }
                            });
                        });
                    }else {
                        console.log('\tThis gene document is not available');
                        $timeout(function () {
                            givePermissionSub(++index);
                        }, 100);
                    }
                } else {
                    console.info('Done.....');
                }
            }

            $scope.resetPermission = function () {
                resetPermissionSub(0);
            }

            function resetPermissionSub(index) {
                if (index < $scope.documents.length) {
                    var _doc = $scope.documents[index];
                    if (_doc && _doc.id) {
                        storage.requireAuth().then(function () {
                            storage.getPermission(_doc.id).then(function (result) {
                                if (result.items && angular.isArray(result.items)) {
                                    result.items.forEach(function (permission, _index) {
                                        if (permission.emailAddress && $scope.adminEmails.indexOf(permission.emailAddress) === -1 && permission.role === 'writer') {
                                            console.log('\tUpdating permission to reader: ', _doc.title, permission.emailAddress);
                                            storage.updatePermission(_doc.id, permission.id, 'reader').then(function (result) {
                                                if (result && result.error) {
                                                    console.log('Error when update permission.');
                                                } else {
                                                    console.log('\tFinish update permission to reader: ', _doc.title, permission.emailAddress);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        });


                        $timeout(function () {
                            resetPermissionSub(++index);
                        }, 100);
                    }else {
                        console.log('\tThis gene document is not available');
                        $timeout(function () {
                            resetPermissionSub(++index);
                        }, 100);
                    }
                } else {
                    console.info('Done.....');
                }
            }

            $scope.giveFolderPermission = function () {
                var emails = ['cbioportal@gmail.com'];
                var folderId = config.folderId;

                emails.forEach(function (email) {
                    storage.requireAuth(true).then(function () {
                        storage.getDocument(folderId).then(function (e1) {
                            if (e1.id) {
                                storage.getPermission(e1.id).then(function (result) {
                                    if (result.items && angular.isArray(result.items)) {
                                        var permissionIndex = -1;
                                        result.items.forEach(function (permission, _index) {
                                            if (permission.emailAddress && permission.emailAddress === email) {
                                                permissionIndex = _index;
                                            }
                                        });

                                        console.log(permissionIndex);
                                        // if(permissionIndex === -1) {
                                        //   storage.insertPermission(e1.id, key, 'user', 'writer').then(function(result){
                                        //     console.log('insert result', result);
                                        //   });
                                        // }else if(result.items[permissionIndex].role !== 'writer'){
                                        //   storage.updatePermission(e1.id, result.items[permissionIndex].id, 'writer').then(function(result){
                                        //     console.log('update result', result);
                                        //   });
                                        // }
                                    }
                                });
                            }
                        });
                    });
                });
            };

            $scope.initialStatus = function () {
                initial($scope.documents, 0, function () {
                    $scope.status.saveAllGenes = true;
                });
            };

            $scope.removeHotspot = function () {
                removeHotspot($scope.documents, 0, function () {
                });
            };

            $scope.initialHotspot = function () {
                DatabaseConnector.getHotspotList(function (data) {
                    if (data) {
                        initHotspot(data, 0, function () {
                            console.log('finished......');
                        });
                    }
                });
            };

            $scope.initialAutoMutation = function () {
                DatabaseConnector.getAutoMutationList(function (data) {
                    if (data) {
                        initAutoMutation(data, 0, function () {
                            console.log('finished......');
                        });
                    }
                });
            };

            $scope.convertLevels = function () {
                console.info('Converting levels...');

                convertLevels(0, function () {
                    console.info('Finished.');
                });
            };

            $scope.convertTumorTypes = function () {
                console.info('Converting tumor types to OncoTree tumor types...');

                convertTumorTypeToOncoTree(0, function () {
                    console.info('Finished.');
                });
            };

            $scope.changeCacheStatus = function() {
                if ($scope.status.cache === 'enabled') {
                    DatabaseConnector.disableCache()
                        .then(function() {
                            $scope.status.cache = 'disabled';
                        }, function() {
                            $scope.status.cache = 'unknown';
                        });
                } else if ($scope.status.cache === 'disabled') {
                    DatabaseConnector.enableCache()
                        .then(function() {
                            $scope.status.cache = 'enabled';
                        }, function() {
                            $scope.status.cache = 'unknown';
                        });
                }
            };

            $scope.resetCache = function() {
                DatabaseConnector.resetCache()
                    .then(function() {
                        console.log('succeed.');
                    }, function() {
                        console.log('failed.');
                    });
            };

            function getCacheStatus() {
                DatabaseConnector.getCacheStatus().then(function(result) {
                    $scope.status.cache = result.hasOwnProperty('status') ? result.status : 'unknown';
                }, function(result) {
                    $scope.status.cache = 'unknown';
                })
            }

            function convertLevels(index, callback) {
                if(index < $scope.documents.length) {
                    var document = $scope.documents[index];
                    storage.getRealtimeDocument(document.id).then(function (realtime) {
                        if (realtime && realtime.error) {
                            console.log('did not get realtime document.');
                        } else {
                            console.log(document.title, '\t\t', index + 1);
                            var model = realtime.getModel();
                            var gene = model.getRoot().get('gene');
                            if (gene) {
                                model.beginCompoundOperation();
                                gene.mutations.asArray().forEach(function (mutation, index) {
                                    mutation.tumors.asArray().forEach(function (tumor) {
                                        tumor.TI.asArray().forEach(function (ti) {
                                            ti.treatments.asArray().forEach(function (treatment) {
                                                if(treatment.level.getText() === '3') {
                                                    console.log('\t', mutation.name.getText());
                                                    console.log('\t\t', tumor.name.getText());
                                                    console.log('\t\t\t', ti.name.getText());
                                                    console.log('\t\t\t\t', 'Drug:', treatment.name.getText(), 'Level:', treatment.level.getText(), '\t converting to ', '3B');
                                                    treatment.level.setText('3B');
                                                }else {
                                                    //console.log('\t\t\t\t', 'Drug:', treatment.name.getText(), 'Level:', treatment.level.getText());
                                                }
                                            })
                                        });
                                    });
                                });
                                model.endCompoundOperation();
                                $timeout(function () {
                                    convertLevels(++index, callback);
                                }, 200, false);
                            } else {
                                console.log('\t\tNo gene model.');
                                $timeout(function () {
                                    convertLevels(++index, callback);
                                }, 200, false);
                            }
                        }
                    });
                }else {
                    if(_.isFunction(callback)) {
                        callback();
                    }
                }
            }

            function convertTumorTypeToOncoTree(index, callback) {
                if (index < $scope.documents.length) {
                    var document = $scope.documents[index];
                    storage.getRealtimeDocument(document.id).then(function(realtime) {
                        if (realtime && realtime.error) {
                            console.log('Did not get realtime document.');
                        } else {
                            console.log(document.title, '\t\t', index + 1);
                            var model = realtime.getModel();
                            var gene = model.getRoot().get('gene');
                            if (gene) {
                                model.beginCompoundOperation();
                                gene.mutations.asArray().forEach(function(mutation, index) {
                                    mutation.tumors.asArray().forEach(function(tumor) {
                                        //Convert to desired OncoTree tumor types
                                        console.log('\tOriginal tumor type: ', tumor.name.getText());
                                        var mapped = $scope.tumorTypes[tumor.name.getText()];
                                        var oncoTreeTumorType = getOncoTreeTumorType(mapped?mapped.oncotree_main : '');
                                        if(oncoTreeTumorType) {
                                            console.log('\t\tFind oncotree tumor type.', oncoTreeTumorType.name);
                                            // tumor.name.setText(oncoTreeTumorType.name);
                                            if(oncoTreeTumorType.hasOwnProperty('code')) {
                                                console.log('\t\t\tCode: ', oncoTreeTumorType.code);
                                                //     tumor.oncoTreeCode.setText(oncoTreeTumorType.code);
                                            }
                                        }else {
                                            
                                        }
                                    });
                                });
                                model.endCompoundOperation();
                                $timeout(function() {
                                    convertTumorTypeToOncoTree(++index, callback);
                                }, 200, false);
                            } else {
                                console.log('\t\tNo gene model.');
                                $timeout(function() {
                                    convertTumorTypeToOncoTree(++index, callback);
                                }, 200, false);
                            }
                        }
                    });
                } else {
                    if (_.isFunction(callback)) {
                        callback();
                    }
                }
            }

            $scope.loopTumorTypes = function() {
                getAllOncoTreeTumorTypes(0, function() {
                    console.log($scope.mappedTumorTypes);
                });
            }
            
            function getOncoTreeTumorType(tumorType) {
                if(tumorType) {
                    tumorType = tumorType.toString().trim();
                    if($scope.mappedTumorTypes.hasOwnProperty(tumorType)) {
                        return $scope.mappedTumorTypes[tumorType];
                    }else {
                        console.log('\t\tNot found.');
                        return null;
                    }
                }else {
                    console.log('\t\tThere is no tumor type provided.');
                    return null;
                }
            }
            
            function getAllOncoTreeTumorTypes(index, callback) {
                if (index < $scope.tumorTypes.length) {
                    var _tumorType = $scope.tumorTypes[index];
                    console.log((index + 1) + '\t' + _tumorType);
                    DatabaseConnector.getOncoTreeTumorTypeByName(_tumorType, false)
                        .then(function(result) {
                            if (result && _.isArray(result.data)) {
                                if (result.data.length === 0) {
                                    console.log('\tCould not find tumor type, looking for main type.');
                                    var mainType = findMainType(_tumorType);
                                    if (mainType) {
                                        $scope.mappedTumorTypes[_tumorType] = mainType;
                                        console.log('\t\tFound main type: ', mainType);
                                    } else {
                                        console.error('\t\tCannot find main type in OncoTree database.')
                                    }
                                } else if (result.data.length === 1) {
                                    $scope.mappedTumorTypes[_tumorType] = result.data[0];
                                    console.log('\t\tFound tumor type:', result.data[0]);
                                } else {
                                    console.error('\tThere are multiple tumor types found in OncoTree database.')
                                }
                                $timeout(function() {
                                    getAllOncoTreeTumorTypes(++index, callback);
                                }, 200, false);
                            } else {
                                console.log('\tNo data available.');
                            }
                        }, function() {
                            console.error('\tAPI error for tumor: ' + _tumorType);
                            $timeout(function() {
                                getAllOncoTreeTumorTypes(++index, callback);
                            }, 200, false);
                        })
                } else {
                    console.log('All tumor types have been mapped with OncoTree tumor type.')
                    if (_.isFunction(callback)) {
                        callback();
                    }
                }
            }
            
            function findMainType(mainType) {
                for(var i = 0 ; i < $scope.oncoTree.mainTypes.length ; i ++) {
                    if($scope.oncoTree.mainTypes[i].name === mainType) {
                        return $scope.oncoTree.mainTypes[i];
                        break;
                    }
                }
                return null;
            }
            
            function getAllMainTypes() {
                DatabaseConnector.getOncoTreeMainTypes()
                    .then(function(result) {
                        if(result && _.isArray(result.data)) {
                            $scope.oncoTree.mainTypes = result.data;
                        }else {
                            console.log('No data available.');
                        }
                    })
            }
            
            function getAlteration(codon, aa) {
                var alteration = [];
                if (codon) {
                    if (aa) {
                        var variants = aa.split(/\|/);
                        var filters = [];
                        variants.forEach(function (e, i) {
                            var components = e.split(':').map(function (str) {
                                return str.trim();
                            });
                            if (components.length === 2 && Number(components[1]) >= 5) {
                                filters.push(components[0]);
                            }
                        });

                        if (filters.length > 0) {
                            alteration = filters.map(function (e) {
                                return codon + e;
                            });
                        }
                    } else {
                        alteration.push(codon);
                    }
                }
                return alteration;
            }

            function initHotspot(list, listIndex, callback) {
                if (listIndex < list.length) {
                    var hugoSymbol = list[listIndex].hugoSymbol || null;
                    var codon = list[listIndex].codon || null;
                    var aa = list[listIndex].aa || null;
                    var alterations = getAlteration(codon, aa) || null;
                    var pmid = list[listIndex].pmid || null;
                    var qval = Number(list[listIndex].qval) || null;
                    var tumorType = list[listIndex].tumorType || null;
                    //console.log('Got gene symbol.', list[listIndex]);
                    if (hugoSymbol) {
                        var document = Documents.get({title: hugoSymbol});
                        //console.log('Got gene document.', document);

                        if (document instanceof Array && document.length > 0) {
                            if (document.length > 1) {
                                console.log('More than one matched document have been found: ', hugoSymbol);
                            }
                            if (alterations && alterations.length > 0) {
                                storage.getRealtimeDocument(document[0].id).then(function (realtime) {
                                    if (realtime && realtime.error) {
                                        console.log('did not get realtime document.');
                                    } else {
                                        console.log(list[listIndex].hugoSymbol, '\t\t', listIndex + 1);
                                        console.log('\t Initializing hotspot...');
                                        var model = realtime.getModel();
                                        var gene = model.getRoot().get('gene');
                                        var index = -1;
                                        //gene.mutations.clear();

                                        model.beginCompoundOperation();
                                        alterations.forEach(function (alt, i) {
                                            index = -1;
                                            gene.mutations.asArray().forEach(function (e, i) {
                                                if (e.name.getText().toLowerCase() === alt.toLowerCase()) {
                                                    console.log('\t\tAlteration already exists, ignore.' + e.name.getText());
                                                    index = i;
                                                }
                                            });
                                            if (index > -1) {
                                                var _mutation = gene.mutations.get(index);
                                                if (_mutation.oncogenic_eStatus.get('hotspot') === 'TRUE') {
                                                    console.log('\t\t\t\tCONTENT::::');
                                                    console.log('\t\t\t\tmutation effect: ', _mutation.effect.value.getText());
                                                    _mutation.effect.value.setText('');
                                                    console.log('\t\t\t\tmutation effect addon: ', _mutation.effect.addOn.getText());
                                                    _mutation.effect.addOn.setText('');
                                                    console.log('\t\t\t\toncogenic: ', _mutation.oncogenic.getText());
                                                    _mutation.oncogenic.setText('');
                                                    console.log('\t\t\t\tdescription: ', _mutation.description.getText());
                                                    _mutation.description.setText('');

                                                    if (pmid) {
                                                        _mutation.oncogenic_eStatus.set('hotspotAddon', (pmid !== 'mdanderson' ? 'PMID: ' : '') + pmid);
                                                        _mutation.oncogenic_eStatus.set('curated', false);
                                                    } else {
                                                        _mutation.oncogenic_eStatus.set('hotspotAddon', 'This mutated amino acid was identified as a recurrent hotspot (statistical significance, q-value < 0.01) in a set of 11,119 tumor samples of various cancer types (based on Chang M. et al. Nature Biotech. 2015).');
                                                        _mutation.oncogenic_eStatus.set('curated', true);
                                                    }
                                                } else {
                                                    console.log('\t\tThis mutation exists, but has hotspot marked as false change the mutation to hotspot mutation ', alt);

                                                    _mutation.oncogenic_eStatus.set('hotspot', 'TRUE');
                                                    if (pmid) {
                                                        _mutation.oncogenic_eStatus.set('hotspotAddon', (pmid !== 'mdanderson' ? 'PMID: ' : '') + pmid);
                                                    } else {
                                                        _mutation.oncogenic_eStatus.set('hotspotAddon', 'This mutated amino acid was identified as a recurrent hotspot (statistical significance, q-value < 0.01) in a set of 11,119 tumor samples of various cancer types (based on Chang M. et al. Nature Biotech. 2015).');
                                                    }
                                                }
                                            } else {
                                                var _mutation = '';
                                                _mutation = model.create(OncoKB.Mutation);
                                                _mutation.name.setText(alt);
                                                _mutation.oncogenic_eStatus.set('obsolete', 'false');
                                                _mutation.oncogenic_eStatus.set('vetted', 'uv');

                                                //if (qval !== null) {
                                                //    _mutation.oncogenic_eStatus.set('hotspotQvalue', qval);
                                                //}
                                                //if (tumorType !== null) {
                                                //    _mutation.oncogenic_eStatus.set('hotspotTumorType', tumorType);
                                                //}

                                                if (pmid) {
                                                    _mutation.oncogenic_eStatus.set('hotspotAddon', (pmid !== 'mdanderson' ? 'PMID: ' : '') + pmid);
                                                    _mutation.oncogenic_eStatus.set('curated', false);
                                                } else {
                                                    _mutation.oncogenic_eStatus.set('hotspotAddon', 'This mutated amino acid was identified as a recurrent hotspot (statistical significance, q-value < 0.01) in a set of 11,119 tumor samples of various cancer types (based on Chang M. et al. Nature Biotech. 2015).');
                                                    _mutation.oncogenic_eStatus.set('curated', true);
                                                }

                                                gene.mutations.push(_mutation);
                                                console.log('New mutation has been added: ', alt);
                                            }
                                        });
                                        model.endCompoundOperation();
                                        $timeout(function () {
                                            initHotspot(list, ++listIndex, callback);
                                        }, 200, false);
                                    }
                                });
                            } else {
                                console.log('No alteration has been fount on gene: ', hugoSymbol);
                                $timeout(function () {
                                    initHotspot(list, ++listIndex, callback);
                                }, 200, false);
                            }
                        } else {
                            console.log('No document has been fount on gene: ', hugoSymbol);
                            $timeout(function () {
                                initHotspot(list, ++listIndex, callback);
                            }, 200, false);
                        }
                    }

                } else {
                    if (callback) {
                        callback();
                    }
                    console.log('finished.');
                }
            }

            function initAutoMutation(list, listIndex, callback) {
                if (listIndex < list.length) {
                    var hugoSymbol = list[listIndex].hugoSymbol || null;
                    var mutation = list[listIndex].mutation || null;
                    var mutationEffect = list[listIndex].mutationEffect || null;
                    var mutationEffectAddon = list[listIndex].mutationEffectAddon || null;
                    var oncogenic = list[listIndex].oncogenic || null;
                    var curated = list[listIndex].curated || null;
                    var shortDescription = list[listIndex].shortDescription || null;
                    var fullDescription = list[listIndex].fullDescription || null;

                    if (hugoSymbol) {
                        var document = Documents.get({title: hugoSymbol});
                        //console.log('Got gene document.', document);

                        if (document instanceof Array && document.length > 0) {
                            if (document.length > 1) {
                                console.log('More than one matched document have been found: ', hugoSymbol);
                            }
                            if (mutation) {
                                storage.getRealtimeDocument(document[0].id).then(function (realtime) {
                                    if (realtime && realtime.error) {
                                        console.log('did not get realtime document.');
                                    } else {
                                        console.log(list[listIndex].hugoSymbol, '\t\t', listIndex + 1);
                                        console.log('\t Initializing status...');
                                        var model = realtime.getModel();
                                        var gene = model.getRoot().get('gene');
                                        var exists = false;
                                        //gene.mutations.clear();
                                        gene.mutations.asArray().forEach(function (e, i) {
                                            if (e.name.getText().toLowerCase() === mutation.toLowerCase()) {
                                                console.log('\t\tAlteration already exists, ignore.' + e.name.getText());
                                                exists = true;
                                            }
                                        });
                                        if (!exists) {
                                            model.beginCompoundOperation();
                                            var _mutation = '';
                                            _mutation = model.create(OncoKB.Mutation);
                                            _mutation.name.setText(mutation);
                                            _mutation.oncogenic_eStatus.set('obsolete', 'false');
                                            _mutation.oncogenic_eStatus.set('vetted', 'uv');

                                            if (oncogenic) {
                                                _mutation.oncogenic.setText(oncogenic);
                                            }

                                            if (curated !== null) {
                                                if (curated.toLowerCase() === 'false') {
                                                    curated = false;
                                                } else {
                                                    curated = true;
                                                }
                                                _mutation.oncogenic_eStatus.set('curated', curated);
                                            }
                                            if (mutationEffect) {
                                                _mutation.effect.value.setText(mutationEffect);
                                                if (mutationEffectAddon) {
                                                    _mutation.effect.addOn.setText(mutationEffectAddon);
                                                }
                                            }

                                            if (shortDescription) {
                                                _mutation.short.setText(shortDescription);
                                            }

                                            if (fullDescription) {
                                                _mutation.description.setText(fullDescription);
                                            }


                                            gene.mutations.push(_mutation);
                                            model.endCompoundOperation();
                                            console.log('\t\tNew mutation has been added: ', mutation);
                                        }
                                        $timeout(function () {
                                            initAutoMutation(list, ++listIndex, callback);
                                        }, 200, false);
                                    }
                                });
                            } else {
                                console.log('\tNo alteration has been fount on gene: ', hugoSymbol);
                                $timeout(function () {
                                    initAutoMutation(list, ++listIndex, callback);
                                }, 200, false);
                            }
                        } else {
                            console.log('\tNo document has been fount on gene: ', hugoSymbol);
                            $timeout(function () {
                                initAutoMutation(list, ++listIndex, callback);
                            }, 200, false);
                        }
                    }

                } else {
                    if (callback) {
                        callback();
                    }
                    console.log('finished.');
                }
            }

            function initial(docs, docIndex, callback) {
                if (docIndex < docs.length) {
                    var fileId = docs[docIndex].id;
                    storage.getRealtimeDocument(fileId).then(function (realtime) {
                        if (realtime && realtime.error) {
                            console.log('did not get realtime document.');
                        } else {
                            realtime.addEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED, function (evt) {
                                if (!evt.isSaving) {
                                    realtime.removeEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED);
                                    storage.closeDocument();
                                    $timeout(function () {
                                        initial(docs, ++docIndex, callback);
                                    }, 200, false);
                                }
                            });
                            console.log(docs[docIndex].title, '\t\t', docIndex + 1);
                            console.log('\t Initializing status...');
                            var model = realtime.getModel();
                            var gene = model.getRoot().get('gene');
                            if (gene) {

                                model.beginCompoundOperation();
                                gene.mutations.asArray().forEach(function (mutation) {
                                    if (!mutation.shortSummary_eStatus.has('obsolete')) {
                                        mutation.shortSummary_eStatus.set('obsolete', 'false');
                                    }
                                    if (!mutation.shortSummary_eStatus.has('vetted')) {
                                        mutation.shortSummary_eStatus.set('vetted', 'uv');
                                    }
                                    ////console.log('Add mutation estatus');
                                    //mutation.tumors.asArray().forEach(function (tumor) {
                                    //    if (!tumor.prevalence_eStatus.has('obsolete')) {
                                    //        tumor.prevalence_eStatus.set('obsolete', 'false');
                                    //    }
                                    //    if (!tumor.progImp_eStatus.has('obsolete')) {
                                    //        tumor.progImp_eStatus.set('obsolete', 'false');
                                    //    }
                                    //
                                    //    //console.log('Add tumor estatus');
                                    //    tumor.TI.asArray().forEach(function (ti) {
                                    //        ti.treatments.asArray().forEach(function (treatment) {
                                    //            if (!treatment.name_eStatus.has('obsolete')) {
                                    //                treatment.name_eStatus.set('obsolete', 'false');
                                    //            }
                                    //        })
                                    //    });
                                    //});
                                });
                                model.endCompoundOperation();
                            } else {
                                console.log('\t\tNo gene model.');
                                $timeout(function () {
                                    initial(docs, ++docIndex, callback);
                                }, 200, false);
                            }
                        }
                    });
                } else {
                    if (callback) {
                        callback();
                    }
                    console.log('finished.');
                }
            }

            function removeHotspot(docs, docIndex, callback) {
                if (docIndex < docs.length) {
                    var fileId = docs[docIndex].id;
                    storage.getRealtimeDocument(fileId).then(function (realtime) {
                        if (realtime && realtime.error) {
                            console.log('did not get realtime document.');
                        } else {
                            realtime.addEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED, function (evt) {
                                if (!evt.isSaving) {
                                    realtime.removeEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED);
                                    storage.closeDocument();
                                    $timeout(function () {
                                        removeHotspot(docs, ++docIndex, callback);
                                    }, 200, false);
                                }
                            });
                            console.log(docs[docIndex].title, '\t\t', docIndex + 1);
                            console.log('\t Removing hotspot...');
                            var model = realtime.getModel();
                            var gene = model.getRoot().get('gene');
                            if (gene) {
                                var removeIndice = [];
                                model.beginCompoundOperation();
                                gene.mutations.asArray().forEach(function (mutation, index) {
                                    if (mutation.oncogenic_eStatus.has('hotspot')) {
                                        if (mutation.oncogenic_eStatus.get('hotspot') === 'TRUE') {
                                            console.log('\t\tMutation: ', mutation.name.getText());
                                            if (mutation.tumors.length === 0 && mutation.effect.value.getText().trim() === '' && mutation.effect.addOn.getText().trim() === '' && mutation.oncogenic.getText().trim() === '' && mutation.short.getText().trim() === '' && mutation.description.getText().trim() === '') {
                                                removeIndice.push(index);
                                                console.log('\t\t\tFound empty hotspot mutation.');
                                            } else {
                                                console.log('\t\t\tHotspot mutation, but has content in it');
                                                console.log('\t\t\t\tCONTENT::::');
                                                console.log('\t\t\t\tNumber of tumors:', mutation.tumors.length);
                                                console.log('\t\t\t\tmutation effect: "' + mutation.effect.value.getText() + '"');
                                                console.log('\t\t\t\tmutation effect addon: "' + mutation.effect.addOn.getText() + '"');
                                                console.log('\t\t\t\toncogenic: "' + mutation.oncogenic.getText() + '"');
                                                console.log('\t\t\t\tShort description: "' + mutation.short.getText() + '"');
                                                console.log('\t\t\t\tdescription: "' + mutation.description.getText() + '"');

                                                if (mutation.oncogenic_eStatus.has('hotspot')) {
                                                    console.log('\t\t\t\t\tRemove hotspot.', mutation.oncogenic_eStatus.get('hotspot'));
                                                    mutation.oncogenic_eStatus.delete('hotspot');
                                                }
                                                if (mutation.oncogenic_eStatus.has('hotspotQvalue')) {
                                                    console.log('\t\t\t\t\tRemove hotspot qvalue.', mutation.oncogenic_eStatus.get('hotspotQvalue'));
                                                    mutation.oncogenic_eStatus.delete('hotspotQvalue');
                                                }
                                                if (mutation.oncogenic_eStatus.has('hotspotTumorType')) {
                                                    console.log('\t\t\t\t\tRemove hotspot tumor type.', mutation.oncogenic_eStatus.get('hotspotTumorType'));
                                                    mutation.oncogenic_eStatus.delete('hotspotTumorType');
                                                }
                                                if (mutation.oncogenic_eStatus.has('hotspotAddon')) {
                                                    console.log('\t\t\t\t\tRemove hotspot addon.', mutation.oncogenic_eStatus.get('hotspotAddon'));
                                                    mutation.oncogenic_eStatus.delete('hotspotAddon');
                                                }
                                            }
                                        }
                                    }

                                    mutation.tumors.asArray().forEach(function (tumor) {
                                        if (tumor.prevalence_eStatus.has('hotspot')) {
                                            tumor.prevalence_eStatus.delete('hotspot');
                                        }
                                        if (tumor.progImp_eStatus.has('hotspot')) {
                                            tumor.progImp_eStatus.set('hotspot');
                                        }
                                        if (tumor.nccn_eStatus.has('hotspot')) {
                                            tumor.nccn_eStatus.set('hotspot');
                                        }

                                        //console.log('Add tumor estatus');
                                        tumor.TI.asArray().forEach(function (ti) {
                                            ti.treatments.asArray().forEach(function (treatment) {
                                                if (treatment.name_eStatus.has('hotspot')) {
                                                    treatment.name_eStatus.delete('hotspot');
                                                }
                                            })
                                        });
                                    });
                                });
                                removeIndice.sort(function (a, b) {
                                    return b - a;
                                });
                                removeIndice.forEach(function (index) {
                                    gene.mutations.remove(index);
                                });
                                console.log(removeIndice);
                                model.endCompoundOperation();
                                //$timeout(function () {
                                //    removeHotspot(docs, ++docIndex, callback);
                                //}, 200, false);
                            } else {
                                console.log('\t\tNo gene model.');
                                $timeout(function () {
                                    removeHotspot(docs, ++docIndex, callback);
                                }, 200, false);
                            }
                        }
                    });
                } else {
                    if (callback) {
                        callback();
                    }
                    console.log('finished.');
                }
            }

            function createDoc(index) {
                if (index < newGenes.length) {
                    storage.requireAuth().then(function () {
                        console.log(index, ' -> Creating', newGenes[index]);
                        // storage.createDocument(newGenes[index], '0BzBfo69g8fP6Mnk3RjVrZ0pJX3M').then(function (file) {
                        storage.createDocument(newGenes[index]).then(function (result) {
                            if (result && result.error) {
                                console.log('Error when creating docuemnt.');
                            } else {
                                $timeout(function () {
                                    createDoc(++index);
                                }, 2000);
                            }
                        });
                    });
                } else {
                    console.log('finished');
                }
            }
        }]
)
    .controller('GeneCtrl', ['_', 'S', '$resource', '$interval', '$timeout', '$scope', '$rootScope', '$location', '$route', '$routeParams', 'dialogs', 'importer', 'driveOncokbInfo', 'storage', 'loadFile', 'user', 'users', 'documents', 'OncoKB', 'gapi', 'DatabaseConnector', 'SecretEmptyKey', '$sce', 'jspdf',
        function (_, S, $resource, $interval, $timeout, $scope, $rootScope, $location, $route, $routeParams, dialogs, importer, DriveOncokbInfo, storage, loadFile, User, Users, Documents, OncoKB, gapi, DatabaseConnector, SecretEmptyKey, $sce, jspdf) {
            $scope.test = function (event, a, b, c, d, e, f, g) {
                $scope.stopCollopse(event);
                console.log(a, b, c, d, e, f, g);
            };
            $scope.authorize = function () {
                storage.requireAuth(false).then(function () {
                    var target = $location.search().target;
                    if (target) {
                        $location.url(target);
                    } else {
                        storage.getDocument('1rFgBCL0ftynBxRl5E6mgNWn0WoBPfLGm8dgvNBaHw38').then(function (file) {
                            storage.downloadFile(file).then(function (text) {
                                $scope.curateFile = text;
                            });
                        });
                    }
                });
            };

            $scope.addMutation = function (newMutationName) {
                if (this.gene && newMutationName) {
                    newMutationName = newMutationName.toString().trim();
                    var exists = false;
                    this.gene.mutations.asArray().forEach(function (e) {
                        if (e.name.getText().toLowerCase() === newMutationName.toLowerCase()) {
                            exists = true;
                        }
                    });

                    if (exists) {
                        dialogs.notify('Warning', 'Mutation exists.');
                    } else {
                        var _mutation = '';
                        $scope.realtimeDocument.getModel().beginCompoundOperation();
                        _mutation = $scope.realtimeDocument.getModel().create(OncoKB.Mutation);
                        _mutation.name.setText(newMutationName);
                        _mutation.oncogenic_eStatus.set('obsolete', 'false');
                        _mutation.shortSummary_eStatus.set('obsolete', 'false');

                        this.gene.mutations.push(_mutation);
                        $scope.realtimeDocument.getModel().endCompoundOperation();
                        $scope.geneStatus[this.gene.mutations.length - 1] = new GeneStatusSingleton();
                        sendEmail(this.gene.name.text + ': new MUTATION added -> ' + newMutationName, ' ');
                    }
                }
            };

            $scope.stateComparator = function (state, viewValue) {
                return viewValue === SecretEmptyKey || ('' + state).toLowerCase().indexOf(('' + viewValue).toLowerCase()) > -1;
            };

            $scope.getComments = function () {
                console.log($scope.comments);
            };

            $scope.addComment = function (object, key, string) {
                var _user = Users.getMe();
                if (object && object[key + '_comments'] && _user.email) {
                    var _comment = '';
                    var _date = new Date();

                    $scope.realtimeDocument.getModel().beginCompoundOperation();
                    _comment = $scope.realtimeDocument.getModel().create('Comment');
                    _comment.date.setText(_date.getTime().toString());
                    if (_user.name) {
                        _comment.userName.setText(_user.name);
                    } else {
                        _comment.userName.setText('Unknown');
                    }
                    _comment.email.setText(_user.email);
                    _comment.content.setText(string);
                    _comment.resolved.setText('false');
                    object[key + '_comments'].push(_comment);
                    $scope.realtimeDocument.getModel().endCompoundOperation();
                } else {
                    console.log('Unable to add comment.');
                }
            };

            $scope.getData = function () {
                var gene = importer.getGeneData(this.gene);
                console.log(gene);
            };

            $scope.updateGene = function () {
                $scope.docStatus.savedGene = false;

                var gene = importer.getGeneData(this.gene, true);
                var vus = importer.getVUSData(this.vus);
                var params = {};

                if(gene) {
                    params.gene = JSON.stringify(gene);
                }
                if(vus) {
                    params.vus = JSON.stringify(vus);
                }
                DatabaseConnector.updateGene(params, function (result) {
                    $scope.docStatus.savedGene = true;
                    console.log('success', result);
                    changeLastUpdate();
                }, function (result) {
                    $scope.docStatus.savedGene = true;
                    console.log('failed', result);
                    changeLastUpdate();
                });
                // }, 1000);
            };

            function changeLastUpdate() {
                if (!$scope.gene.status_timeStamp.has('lastUpdate')) {
                    var timeStamp;
                    $scope.realtimeDocument.getModel().beginCompoundOperation();
                    timeStamp = $scope.realtimeDocument.getModel().create('TimeStamp');
                    timeStamp.value.setText(new Date().getTime().toString());
                    timeStamp.by.setText(Users.getMe().name);
                    $scope.gene.status_timeStamp.set('lastUpdate', timeStamp);
                    $scope.realtimeDocument.getModel().endCompoundOperation();

                } else {
                    $scope.gene.status_timeStamp.get('lastUpdate').value.setText(new Date().getTime().toString());
                    $scope.gene.status_timeStamp.get('lastUpdate').by.setText(Users.getMe().name);
                }
                $scope.docStatus.updateGene = true;
            }

            $scope.addTumorType = function (mutation, newMainType, newTumorType, mutationIndex) {
                if (mutation && newMainType) {
                    var _tumorType = '';
                    var exists = false;

                    mutation.tumors.asArray().forEach(function (e) {
                        if (e.name.getText().toLowerCase() === ((newTumorType && newTumorType.name) ? newTumorType.name.toLowerCase() : newMainType.name.toLowerCase())) {
                            exists = true;
                        }
                    });

                    if (exists) {
                        dialogs.notify('Warning', 'Tumor type exists.');
                    } else {
                        $scope.realtimeDocument.getModel().beginCompoundOperation();
                        _tumorType = $scope.realtimeDocument.getModel().create(OncoKB.Tumor);
                        if(newTumorType && newTumorType.code) {
                            _tumorType.name.setText(newTumorType.code ? newTumorType.name : newMainType.name);
                            _tumorType.oncoTreeCode.setText(newTumorType.code);
                        }else {
                            _tumorType.name.setText(newMainType.name);
                        }
                        _tumorType.nccn.category.setText('2A');
                        for (var i = 0; i < 4; i++) {
                            var __ti = $scope.realtimeDocument.getModel().create(OncoKB.TI);
                            var __status = i < 2 ? 1 : 0; // 1: Standard, 0: Investigational
                            var __type = i % 2 === 0 ? 1 : 0; //1: sensitivity, 0: resistance
                            var __name = (__status ? 'Standard' : 'Investigational') + ' implications for ' + (__type ? 'sensitivity' : 'resistance') + ' to therapy';

                            __ti.types.set('status', __status.toString());
                            __ti.types.set('type', __type.toString());
                            __ti.name.setText(__name);
                            _tumorType.TI.push(__ti);
                        }
                        mutation.tumors.push(_tumorType);
                        $scope.realtimeDocument.getModel().endCompoundOperation();
                        $scope.geneStatus[mutationIndex][mutation.tumors.length - 1] = new GeneStatusSingleton();
                    }
                }
            };

            //Add new therapeutic implication
            $scope.addTI = function (ti, index, newTIName, mutationIndex, tumorIndex, tiIndex) {
                if (ti && newTIName) {
                    var _treatment = '';
                    var exists = false;
                    newTIName = newTIName.toString().trim();

                    ti.treatments.asArray().forEach(function (e) {
                        if (e.name.getText().toLowerCase() === newTIName.toLowerCase()) {
                            exists = true;
                        }
                    });

                    if (exists) {
                        dialogs.notify('Warning', 'Therapy exists.');
                    } else {
                        $scope.realtimeDocument.getModel().beginCompoundOperation();
                        _treatment = $scope.realtimeDocument.getModel().create(OncoKB.Treatment);
                        _treatment.name.setText(newTIName);
                        _treatment.type.setText('Therapy');
                        if ($scope.checkTI(ti, 1, 1)) {
                            _treatment.level.setText('1');
                        } else if ($scope.checkTI(ti, 0, 1)) {
                            _treatment.level.setText('4');
                        } else if ($scope.checkTI(ti, 1, 0)) {
                            _treatment.level.setText('1');
                        } else if ($scope.checkTI(ti, 0, 0)) {
                            _treatment.level.setText('4');
                        }
                        ti.treatments.push(_treatment);
                        $scope.realtimeDocument.getModel().endCompoundOperation();
                        $scope.geneStatus[mutationIndex][tumorIndex][tiIndex][ti.treatments.length - 1] = new GeneStatusSingleton();
                    }
                }
            };

            $scope.onFocus = function (e) {
                $timeout(function () {
                    /* jshint -W117 */
                    $(e.target).trigger('input');
                    $(e.target).trigger('change'); // for IE
                    /* jshint +W117 */
                });
            };

            //Add new therapeutic implication
            $scope.addTrial = function (trials, newTrial) {
                if (trials && newTrial) {
                    if (trials.indexOf(newTrial) === -1) {
                        if (newTrial.match(/NCT[0-9]+/ig)) {
                            trials.push(newTrial);
                        } else {
                            dialogs.notify('Warning', 'Please check your trial ID format. (e.g. NCT01562899)');
                        }
                    } else {
                        dialogs.notify('Warning', 'Trial exists.');
                    }
                }
            };

            $scope.addVUSItem = function (newVUSName, newVUSTime) {
                if (newVUSName) {
                    var notExist = true;
                    newVUSName = newVUSName.trim();
                    $scope.gene.mutations.asArray().forEach(function (e, i) {
                        if (e.name.getText().trim().toLowerCase() === newVUSName.toLowerCase()) {
                            notExist = false;
                        }
                    });

                    if (notExist && !containVariantInVUS(newVUSName)) {
                        $scope.realtimeDocument.getModel().beginCompoundOperation();
                        var vus = $scope.realtimeDocument.getModel().create(OncoKB.VUSItem);
                        var timeStamp = $scope.realtimeDocument.getModel().create(OncoKB.TimeStampWithCurator);

                        if (!newVUSTime) {
                            newVUSTime = new Date().getTime().toString();
                        }

                        timeStamp.value.setText(newVUSTime);
                        timeStamp.by.name.setText(User.name);
                        timeStamp.by.email.setText(User.email);
                        vus.name.setText(newVUSName);
                        vus.time.push(timeStamp);
                        $scope.vus.push(vus);
                        $scope.realtimeDocument.getModel().endCompoundOperation();
                    } else {
                        dialogs.notify('Warning', 'Variant exists.');
                    }
                }
            };

            $scope.cleanTrial = function (trials) {
                var cleanTrials = {};
                trials.asArray().forEach(function (e, index) {
                    if (cleanTrials.hasOwnProperty(e)) {
                        cleanTrials[e].push(index);
                    } else {
                        cleanTrials[e] = [];
                    }
                });
                /*jshint -W083 */
                for (var key in cleanTrials) {
                    if (cleanTrials[key].length > 0) {
                        cleanTrials[key].forEach(function () {
                            trials.removeValue(key);
                        });
                    }
                }
                /*jshint +W083 */
                console.log(cleanTrials);
            };

            $scope.addTrialStr = function (trials) {
                if (trials && this.trialsStr) {
                    var _trials = this.trialsStr.split(/\s+/);
                    _trials.forEach(function (e) {
                        if (trials.indexOf(e) === -1) {
                            trials.push(e);
                        }
                    });
                    this.trialsStr = '';
                }
            };

            $scope.checkScope = function () {
                console.log($scope.gene);
                //console.log($scope.gene.mutations.get(0).tumors.get(0));
                console.log($scope.geneStatus);

                console.log('Num of watchers: ' + checkNumWatchers());
                console.log($scope.gene.status_timeStamp.get('lastEdit').value);
                console.log($scope.gene.status_timeStamp.get('lastUpdate').value);

                $scope.gene.mutations.asArray().forEach(function (e) {
                    console.log('------------------');
                    console.log(e);
                    console.log(e.shortSummary);
                    console.log(e.shortSummary_eStatus);
                    console.log(e.shortSummary_eStatus.get('curated'));
                    console.log(e.effect);
                    console.log(e.oncogenic);
                    console.log(e.description);
                    console.log('------------------');
                });
            };

            $scope.updateGeneColor = function () {
                if ($scope.gene) {
                    if (Number($scope.gene.status_timeStamp.get('lastEdit').value.text) > Number($scope.gene.status_timeStamp.get('lastUpdate').value.text)) {
                        return 'red';
                    } else {
                        return 'black';
                    }
                }
            };

            $scope.remove = function (event, mutationIndex, tumorTypeIndex, therapyCategoryIndex, therapyIndex) {
                $scope.stopCollopse(event);
                var dlg = dialogs.confirm('Confirmation', 'Are you sure you want to delete this entry?');
                dlg.result.then(function () {
                    var _index = -1;
                    console.log(mutationIndex, tumorTypeIndex, therapyCategoryIndex, therapyIndex);
                    if (angular.isNumber(mutationIndex)) {
                        if (!isNaN(mutationIndex)) {
                            if (isNaN(tumorTypeIndex)) {
                                _index = Number(angular.copy(mutationIndex));
                                $scope.gene.mutations.remove(_index);
                                delete $scope.geneStatus[mutationIndex];
                                $scope.geneStatus = migrateGeneStatusPosition($scope.geneStatus, _index);
                            } else {
                                if (!isNaN(therapyCategoryIndex) && !isNaN(therapyIndex)) {
                                    _index = Number(angular.copy(therapyIndex));
                                    $scope.gene.mutations.get(mutationIndex).tumors.get(tumorTypeIndex).TI.get(therapyCategoryIndex).treatments.remove(therapyIndex);
                                    delete $scope.geneStatus[mutationIndex][tumorTypeIndex][therapyCategoryIndex][_index];
                                    $scope.geneStatus[mutationIndex][tumorTypeIndex][therapyCategoryIndex] = migrateGeneStatusPosition($scope.geneStatus[mutationIndex][tumorTypeIndex][therapyCategoryIndex], _index);
                                } else {
                                    _index = Number(angular.copy(tumorTypeIndex));
                                    $scope.gene.mutations.get(mutationIndex).tumors.remove(_index);
                                    delete $scope.geneStatus[mutationIndex][_index];
                                    $scope.geneStatus[mutationIndex] = migrateGeneStatusPosition($scope.geneStatus[mutationIndex], _index);
                                }
                            }
                        }
                    } else {
                        mutationIndex.remove(tumorTypeIndex);
                    }
                }, function () {
                });
            };

            $scope.commentClick = function (event) {
                $scope.stopCollopse(event);
            };

            $scope.redo = function () {
                $scope.model.redo();
                regenerateGeneStatus();
            };

            $scope.undo = function () {
                $scope.model.undo();
                regenerateGeneStatus();
            };

            $scope.curatorsName = function () {
                return this.gene.curators.asArray().map(function (d) {
                    return d.name;
                }).join(', ');
            };

            $scope.curatorsEmail = function () {
                return this.gene.curators.asArray().map(function (d) {
                    return d.email;
                }).join(', ');
            };

            $scope.removeCurator = function (index) {
                $scope.gene.curators.remove(index);
            };

            $scope.checkTI = function (TI, status, type) {
                var _status = TI.types.get('status').toString();
                var _type = TI.types.get('type').toString();
                status = status.toString();
                type = type.toString();
                if (_status === status && _type === type) {
                    return true;
                } else {
                    return false;
                }
            };

            $scope.mutationEffectChanged = function (mutationEffect) {
                mutationEffect.addOn.setText('');
            };

            $scope.move = function (driveList, index, moveIndex, event) {
                var tmpStatus;
                var moveStatusIndex;
                var indexes = [];
                var geneStatus = angular.copy($scope.geneStatus);
                var key, numKey;
                $scope.stopCollopse(event);

                index = parseInt(index);
                moveIndex = parseInt(moveIndex);

                if (moveIndex <= index) {
                    if (moveIndex <= 0) {
                        moveIndex = moveStatusIndex = 0;
                    } else {
                        moveIndex = moveStatusIndex = moveIndex - 1;
                    }
                } else {
                    moveStatusIndex = moveIndex - 1;
                }

                if (moveIndex > driveList.length) {
                    moveIndex = driveList.length;
                    moveStatusIndex = moveIndex - 1;
                }

                tmpStatus = angular.copy($scope.geneStatus[index]);

                if (index < moveStatusIndex) {
                    for (key in geneStatus) {
                        if (!isNaN(key)) {
                            numKey = Number(key);
                            if (numKey <= moveStatusIndex && numKey > index) {
                                indexes.push(numKey);
                            }
                        }
                    }
                    indexes.sort(function (a, b) {
                        return a - b;
                    }).forEach(function (e) {
                        geneStatus[e - 1] = geneStatus[e];
                    });
                } else {
                    for (key in geneStatus) {
                        if (!isNaN(key)) {
                            numKey = Number(key);
                            if (numKey >= moveStatusIndex && numKey < index) {
                                indexes.push(numKey);
                            }
                        }
                    }
                    indexes.sort(function (a, b) {
                        return b - a;
                    }).forEach(function (e) {
                        geneStatus[e + 1] = geneStatus[e];
                    });
                }

                geneStatus[moveStatusIndex] = tmpStatus;

                $scope.geneStatus = geneStatus;

                driveList.move(index, moveIndex);
            };

            $scope.stopCollopse = function (event) {
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                if (event.preventDefault && event.type !== 'keypress') {
                    event.preventDefault();
                }
            };

            $scope.setGeneStatus = function () {
                var newStatus = {
                    geneId: $scope.gene.name.text,
                    status: $scope.gene.status.text
                };
                Documents.updateStatus(newStatus);
                DatabaseConnector.setGeneStatus(newStatus).then(function (result) {
                    if (result && result.error) {
                        console.error(result);
                    } else {
                        console.info(result);
                    }
                });
            };

            $scope.generatePDF = function () {
                jspdf.create(importer.getGeneData(this.gene, true));
            };

            $scope.isOpenFunc = function (type) {
                var processKey = '';
                var targetStatus = '';
                var geneStatus = $scope.geneStatus;
                var specialEscapeKeys = ['isOpen', 'hideEmpty'];
                var flag;
                if (type === 'expand') {
                    targetStatus = true;
                    processKey = 'isOpen';
                } else if (type === 'collapse') {
                    targetStatus = false;
                    processKey = 'isOpen';
                } else if (type === 'hideEmpty') {
                    targetStatus = true;
                    processKey = 'hideEmpty';
                } else if (type === 'showEmpty') {
                    targetStatus = false;
                    processKey = 'hideEmpty';
                }

                //for: mutation
                for (var key in geneStatus) {
                    if (!isNaN(key)) {
                        geneStatus[key][processKey] = targetStatus;
                    }

                    //for: tumor type
                    for (var _key in geneStatus[key]) {
                        //for: therapeutic implications
                        if (specialEscapeKeys.indexOf(_key) === -1) {
                            flag = targetStatus;
                            if (isNaN(_key) && flag) {
                                flag = processKey === 'isOpen' ? ($scope.gene.mutations.get(Number(key))[_key].text ? targetStatus : false) : targetStatus;
                            }
                            geneStatus[key][_key][processKey] = flag;


                            for (var __key in geneStatus[key][_key]) {
                                flag = targetStatus;
                                if (specialEscapeKeys.indexOf(__key) === -1) {
                                    if (isNaN(__key)) {
                                        if (processKey === 'isOpen') {
                                            if (__key === 'nccn') {
                                                flag = $scope.hasNccn($scope.gene.mutations.get(Number(key)).tumors.get(Number(_key)).nccn) ? targetStatus : false;
                                            } else if (__key === 'trials') {
                                                flag = $scope.gene.mutations.get(Number(key)).tumors.get(Number(_key)).trials.length > 0 ? targetStatus : false;
                                            } else {
                                                flag = $scope.gene.mutations.get(Number(key)).tumors.get(Number(_key))[__key].text ? targetStatus : false;
                                            }
                                        } else {
                                            flag = targetStatus;
                                        }
                                        geneStatus[key][_key][__key][processKey] = flag;
                                    } else if (!isNaN(__key)) {
                                        if ($scope.gene.mutations.get(Number(key)).tumors.get(Number(_key)).TI.get(Number(__key)).treatments.length > 0) {
                                            //for: treatments
                                            geneStatus[key][_key][__key][processKey] = flag;
                                            for (var ___key in geneStatus[key][_key][__key]) {
                                                if (specialEscapeKeys.indexOf(___key) === -1) {
                                                    geneStatus[key][_key][__key][___key][processKey] = flag;
                                                }
                                            }
                                        } else if ($scope.gene.mutations.get(Number(key)).tumors.get(Number(_key)).TI.get(Number(__key)).description.text) {
                                            geneStatus[key][_key][__key][processKey] = flag;
                                        } else {
                                            if (processKey === 'isOpen') {
                                                geneStatus[key][_key][__key].isOpen = false;
                                            } else {
                                                geneStatus[key][_key][__key][processKey] = flag;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                $scope.geneStatus = geneStatus;
            };

            $scope.changeIsOpen = function (target) {
                target = !target;
            };

            $scope.checkEmpty = function (mutation, type) {
                if(type === 'mutationEffect') {
                    if (mutation.effect.value.text === '' && mutation.description.text === '') {
                        return true;
                    } else {
                        return false;
                    }
                }else if(type === 'oncogenicity') {
                    if ((mutation.oncogenic.text === '' || mutation.oncogenic.text === 'false') && mutation.shortSummary.text === '') {
                        return true;
                    } else {
                        return false;
                    }
                }else {
                    return false;
                }
            };

            $scope.hasNccn = function (nccn) {
                if (nccn) {
                    if (nccn.disease.text && nccn.disease.text !== 'NA') {
                        return true;
                    }
                }
                return false;
            };

            $scope.curatedIconClick = function (event, status) {
                $scope.stopCollopse(event);
                status.set('curated', !status.get('curated'));
            };

            function regenerateGeneStatus() {
                var geneStatus = {};
                var mutationKeys = ['oncogenic'];
                var tumorKeys = ['prevalence', 'progImp', 'nccn', 'trials'];

                $scope.gene.mutations.asArray().forEach(function (mutation, mutationIndex) {
                    geneStatus[mutationIndex] = new GeneStatusSingleton();
                    mutationKeys.forEach(function (key) {
                        if (mutation[key]) {
                            geneStatus[mutationIndex][key] = new GeneStatusSingleton();
                        }
                    });

                    if (mutation.tumors.length > 0) {
                        mutation.tumors.asArray().forEach(function (tumor, tumorIndex) {
                            geneStatus[mutationIndex][tumorIndex] = new GeneStatusSingleton();
                            tumorKeys.forEach(function (key) {
                                if (tumor[key]) {
                                    geneStatus[mutationIndex][tumorIndex][key] = new GeneStatusSingleton();
                                }
                                tumor.TI.asArray(function (therapyType, therapyTypeIndex) {
                                    geneStatus[mutationIndex][tumorIndex][therapyTypeIndex] = new GeneStatusSingleton();
                                });
                            });
                        });
                    }
                });
                $scope.geneStatus = geneStatus;
            }

            function migrateGeneStatusPosition(object, indexRemoved) {
                if (angular.isNumber(indexRemoved)) {
                    var indexes = [];
                    for (var key in object) {
                        if (!isNaN(key) && Number(key) > indexRemoved) {
                            indexes.push(Number(key));
                        }
                    }

                    indexes.sort(function (a, b) {
                        return a - b;
                    }).forEach(function (e) {
                        object[e - 1] = object[e];
                    });

                    delete object[indexes.pop()];
                    return object;
                }
                return false;
            }

            function checkNumWatchers() {
                var root = angular.element(document.getElementsByTagName('body'));

                var watchers = [];

                var f = function (element) {
                    angular.forEach(['$scope', '$isolateScope'], function (scopeProperty) {
                        if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                            angular.forEach(element.data()[scopeProperty].$$watchers, function (watcher) {
                                watchers.push(watcher);
                            });
                        }
                    });

                    angular.forEach(element.children(), function (childElement) {
                        f(angular.element(childElement));
                    });
                };

                f(root);

                // Remove duplicate watchers
                var watchersWithoutDuplicates = [];
                angular.forEach(watchers, function (item) {
                    if (watchersWithoutDuplicates.indexOf(item) < 0) {
                        watchersWithoutDuplicates.push(item);
                    }
                });

                console.log(watchersWithoutDuplicates);

                return watchersWithoutDuplicates.length;
            }

            function sendEmail(subject, content) {
                if ($scope.userRole < 8) {
                    var param = {subject: subject, content: content};

                    DatabaseConnector.sendEmail(
                        param,
                        function (result) {
                            console.log('success', result);
                        },
                        function (result) {
                            console.log('failed', result);
                        }
                    );
                }
            }

            function getDriveOncokbInfo() {
                var pubMedLinks = DriveOncokbInfo.getPubMed({gene: $scope.fileTitle});
                var pubMedLinksLength = 0;
                $scope.suggestedMutations = DriveOncokbInfo.getMutation($scope.fileTitle) || [];
                if ($scope.suggestedMutations.length === 0) {
                    $scope.addMutationPlaceholder = 'Based on our search criteria no hotspot mutation found. Please curate according to literature.';
                }

                $scope.pubMedLinks = {
                    gene: pubMedLinks.gene.pubMedLinks || [],
                    mutations: pubMedLinks.mutations.pubMedMutationLinks || {}
                };

                for (var key in $scope.pubMedLinks.mutations) {
                    pubMedLinksLength += $scope.pubMedLinks.mutations[key].length;
                }
                $scope.pubMedMutationLength = Object.keys($scope.pubMedLinks.mutations).length;
                $scope.pubMedMutationLinksLength = pubMedLinksLength;
                $scope.pubMedLinksLength = pubMedLinksLength + $scope.pubMedLinks.gene.length;
            }

            function bindDocEvents() {
                $scope.realtimeDocument.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, displayCollaboratorEvent);
                $scope.realtimeDocument.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, displayCollaboratorEvent);
                $scope.realtimeDocument.addEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED, saveStateChangedEvent);
                $scope.model.addEventListener(gapi.drive.realtime.EventType.UNDO_REDO_STATE_CHANGED, onUndoStateChanged);
                $scope.gene.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, valueChangedEvent);
            }

            function saveStateChangedEvent(evt) {
                if (!$scope.$$phase) {
                    $scope.$apply(function () {
                        updateDocStatus(evt);
                    });
                } else {
                    updateDocStatus(evt);
                }
            }

            function updateDocStatus(evt) {
                if (evt.isSaving) {
                    documentSaving();
                } else if (!evt.isSaving && !evt.currentTarget.isClosed) {
                    documentSaved();
                } else {
                    documentClosed();
                }
            }

            function afterCreateGeneModel() {
                var file = Documents.get({title: $scope.fileTitle});
                var timeStamp;
                file = file[0];
                if (!$scope.gene.status_timeStamp.has('lastEdit')) {
                    $scope.realtimeDocument.getModel().beginCompoundOperation();
                    timeStamp = $scope.realtimeDocument.getModel().create('TimeStamp');
                    timeStamp.value.setText(new Date().getTime().toString());
                    timeStamp.by.setText(Users.getMe().name);
                    $scope.gene.status_timeStamp.set('lastEdit', timeStamp);
                    $scope.realtimeDocument.getModel().endCompoundOperation();
                }
                if (!$scope.gene.status_timeStamp.has('lastUpdate')) {
                    $scope.realtimeDocument.getModel().beginCompoundOperation();
                    timeStamp = $scope.realtimeDocument.getModel().create('TimeStamp');
                    timeStamp.value.setText(new Date().getTime().toString());
                    timeStamp.by.setText(Users.getMe().name);
                    $scope.gene.status_timeStamp.set('lastUpdate', timeStamp);
                    $scope.realtimeDocument.getModel().endCompoundOperation();
                }
                $scope.document = file;
                $scope.fileEditable = file.editable ? true : false;
                addVUS();
                $scope.status.rendering = false;
                displayAllCollaborators($scope.realtimeDocument, bindDocEvents);
            }

            function valueChangedEvent(evt) {
                console.log('valueChanged', evt);
                if ($scope.gene) {
                    var hasCurator = false;
                    if ($scope.gene.curators && angular.isArray($scope.gene.curators.asArray()) && $scope.gene.curators.asArray().length > 0) {
                        var _array = $scope.gene.curators.asArray();
                        for (var i = 0; i < _array.length; i++) {
                            if (_array[i].email.text === User.email) {
                                hasCurator = true;
                                break;
                            }
                        }

                        if (!hasCurator) {
                            $scope.realtimeDocument.getModel().beginCompoundOperation();
                            var __curator = $scope.realtimeDocument.getModel().create(OncoKB.Curator, User.name, User.email);
                            $scope.gene.curators.push(__curator);
                            $scope.realtimeDocument.getModel().endCompoundOperation();
                        }
                    } else {
                        $scope.realtimeDocument.getModel().beginCompoundOperation();
                        var _curator = $scope.realtimeDocument.getModel().create(OncoKB.Curator, User.name, User.email);
                        $scope.gene.curators.push(_curator);
                        $scope.realtimeDocument.getModel().endCompoundOperation();
                    }
                }
            }

            function displayCollaboratorEvent(evt) {
                switch (evt.type) {
                    case 'collaborator_left':
                        removeCollaborator(evt.collaborator);
                        break;
                    case 'collaborator_joined':
                        addCollaborator(evt.collaborator);
                        break;
                    default:
                        console.info('Unknown event:', evt);
                        break;
                }
                $scope.$apply($scope.collaborators);
            }

            function addCollaborator(user) {
                if (!$scope.collaborators.hasOwnProperty(user.userId)) {
                    $scope.collaborators[user.sessionId] = {};
                }
                $scope.collaborators[user.sessionId] = user;
            }

            function removeCollaborator(user) {
                if (!$scope.collaborators.hasOwnProperty(user.sessionId)) {
                    console.log('Unknown collaborator:', user);
                } else {
                    delete $scope.collaborators[user.sessionId];
                }
            }

            function displayAllCollaborators(document, callback) {
                var collaborators = document.getCollaborators();
                var collaboratorCount = collaborators.length;
                var _user = {};
                for (var i = 0; i < collaboratorCount; i++) {
                    var user = collaborators[i];
                    if (!$scope.collaborators.hasOwnProperty(user.userId)) {
                        $scope.collaborators[user.sessionId] = {};
                    }
                    $scope.collaborators[user.sessionId] = user;
                    if (user.isMe) {
                        _user = user;
                    }
                }

                if (User.email === 'N/A') {
                    storage.getUserInfo(_user.userId).then(function (userInfo) {
                        User.name = userInfo.displayName;
                        User.email = angular.isArray(userInfo.emails) ? (userInfo.emails.length > 0 ? userInfo.emails[0].value : 'N/A') : userInfo.emails;
                        callback();
                    });
                } else {
                    callback();
                }
            }

            function onUndoStateChanged(evt) {
                if (evt.canUndo) {
                    $scope.canUndo = true;
                } else {
                    $scope.canUndo = false;
                }
                if (evt.canRedo) {
                    $scope.canRedo = true;
                } else {
                    $scope.canRedo = false;
                }
            }

            function documentSaving() {
                $scope.docStatus.saving = true;
                $scope.docStatus.saved = false;
                $scope.docStatus.closed = false;
            }

            function documentSaved() {
                if (!$scope.docStatus.updateGene) {
                    $scope.gene.status_timeStamp.get('lastEdit').value.setText(new Date().getTime().toString());
                    $scope.gene.status_timeStamp.get('lastEdit').by.setText(Users.getMe().name);
                }
                $scope.docStatus.saving = false;
                $scope.docStatus.saved = true;
                $scope.docStatus.closed = false;
                $scope.docStatus.updateGene = false;
            }

            function documentClosed() {
                $scope.docStatus.closed = true;
                $scope.docStatus.saving = false;
                $scope.docStatus.saved = false;
                $scope.fileEditable = false;
            }

            function getOncoTreeMainTypes() {
                DatabaseConnector.getOncoTreeMainTypes()
                    .then(function(result) {
                        if(result.data) {
                            console.log(result.data);
                            $scope.oncoTree.mainTypes = result.data;
                        }
                    }, function(error) {
                        console.log(error);
                    });
            }

            function getLevels() {
                var desS = {
                    '': '',
                    '0': 'FDA-approved drug in this indication irrespective of gene/variant biomarker.',
                    '1': 'FDA-approved biomarker and drug in this indication.',
                    '2A': 'Standard-of-care biomarker and drug in this indication but not FDA-approved.',
                    '2B': 'FDA-approved biomarker and drug in another indication, but not FDA or NCCN compendium-listed for this indication.',
                    '3': 'Clinical evidence links this biomarker to drug response but no FDA-approved or NCCN compendium-listed biomarker and drug association.',
                    '3A': 'Clinical evidence links biomarker to drug response in this indication but neither biomarker or drug are FDA-approved or NCCN compendium-listed.',
                    '3B': 'Clinical evidence links biomarker to drug response in another indication but neither biomarker or drug are FDA-approved or NCCN compendium-listed.',
                    '4': 'Preclinical evidence associates this biomarker to drug response, where the biomarker and drug are NOT FDA-approved or NCCN compendium-listed.'
                };

                var desR = {
                    '': '',
                    'R1': 'NCCN-compendium listed biomarker for resistance to a FDA-approved drug.',
                    'R2': 'Not NCCN compendium-listed biomarker, but clinical evidence linking this biomarker to drug resistance.',
                    'R3': 'Not NCCN compendium-listed biomarker, but preclinical evidence potentially linking this biomarker to drug resistance.'
                };

                var levels = {};

                var levelsCategories = {
                    SS: ['', '0', '1', '2A'],
                    SR: ['R1'],
                    IS: ['', '2B', '3A', '3B', '4'],
                    IR: ['R2', 'R3']
                };

                for (var key in levelsCategories) {
                    var _items = levelsCategories[key];
                    levels[key] = [];
                    for (var i = 0; i < _items.length; i++) {
                        var __datum = {};
                        __datum.label = _items[i] + (_items[i] === '' ? '' : ' - ') + ( (['SS', 'IS'].indexOf(key) !== -1) ? desS[_items[i]] : desR[_items[i]]);
                        __datum.value = _items[i];
                        levels[key].push(__datum);
                    }
                }
                return levels;
            }

            function GeneStatusSingleton() {
                this.isOpen = false;
                this.hideEmpty = false;
            }

            function containVariantInVUS(variantName) {
                var size = $scope.vus.length;

                for (var i = 0; i < size; i++) {
                    if ($scope.vus.get(i).name.getText() === variantName) {
                        return true;
                    }
                }

                return false;
            }

            function addVUS() {
                var model = $scope.realtimeDocument.getModel();
                var vus;
                if (!model.getRoot().get('vus')) {
                    vus = model.createList();
                    model.getRoot().set('vus', vus);
                } else {
                    vus = model.getRoot().get('vus');
                }
                $scope.vus = vus;
            }

            $scope.fileTitle = $routeParams.geneName;
            $scope.gene = '';
            $scope.vus = '';
            $scope.comments = '';
            $scope.newGene = {};
            $scope.collaborators = {};
            $scope.checkboxes = {
                'oncogenic': ['YES', 'LIKELY', 'NO', 'UNKNOWN'],
                'mutation_effect': ['Activating', 'Inactivating', 'Other'],
                'geneStatus': ['Complete', 'Proceed with caution', 'Not ready'],
                'hotspot': ['TRUE', 'FALSE']
            };
            $scope.nccnDiseaseTypes = ['', 'Acute Lymphoblastic Leukemia', 'Acute Myeloid Leukemia      20th Annual Edition!', 'Anal Carcinoma', 'Bladder Cancer', 'Bone Cancer', 'Breast Cancer', 'Cancer of Unknown Primary (See Occult Primary)', 'Central Nervous System Cancers', 'Cervical Cancer', 'Chronic Myelogenous Leukemia', 'Colon/Rectal Cancer', 'Colon Cancer      20th Annual Edition!', 'Rectal Cancer      20th Annual Edition!', 'Cutaneous Melanoma (See Melanoma)', 'Endometrial Cancer (See Uterine Neoplasms)', 'Esophageal and Esophagogastric Junction Cancers', 'Fallopian Tube Cancer (See Ovarian Cancer)', 'Gastric Cancer', 'Head and Neck Cancers', 'Hepatobiliary Cancers', 'Hodgkin Lymphoma', 'Kidney Cancer', 'Malignant Pleural Mesothelioma', 'Melanoma', 'Multiple Myeloma/Other Plasma Cell Neoplasms', 'Multiple Myeloma', 'Systemic Light Chain Amyloidosis', 'Waldenström\'s Macroglobulinemia / Lymphoplasmacytic Lymphoma', 'Myelodysplastic Syndromes', 'Neuroendocrine Tumors', 'Non-Hodgkin\'s Lymphomas', 'Non-Melanoma Skin Cancers', 'Basal Cell Skin Cancer', 'Dermatofibrosarcoma Protuberans', 'Merkel Cell Carcinoma', 'Squamous Cell Skin Cancer', 'Non-Small Cell Lung Cancer      20th Annual Edition!', 'Occult Primary', 'Ovarian Cancer', 'Pancreatic Adenocarcinoma', 'Penile Cancer', 'Primary Peritoneal Cancer (See Ovarian Cancer)', 'Prostate Cancer      20th Annual Edition!', 'Small Cell Lung Cancer      20th Annual Edition!', 'Soft Tissue Sarcoma', 'Testicular Cancer', 'Thymomas and Thymic Carcinomas', 'Thyroid Carcinoma', 'Uterine Neoplasms'];
            $scope.nccnCategories = [
                {
                    label: '',
                    value: ''
                },
                {
                    label: 'Category 1: Based upon high-level evidence, there is uniform NCCN consensus that the intervention is appropriate.',
                    value: '1'
                },
                {
                    label: 'Category 2A: Based upon lower-level evidence, there is uniform NCCN consensus that the intervention is appropriate.',
                    value: '2A'
                },
                {
                    label: 'Category 2B: Based upon lower-level evidence, there is NCCN consensus that the intervention is appropriate.',
                    value: '2B'
                },
                {
                    label: 'Category 3: Based upon any level of evidence, there is major NCCN disagreement that the intervention is appropriate.',
                    value: '3'
                },
            ];
            $scope.levels = getLevels();
            $scope.fileEditable = false;
            $scope.docStatus = {
                saved: true,
                saving: false,
                closed: false,
                savedGene: true,
                updateGene: false
            };
            $scope.addMutationPlaceholder = 'Mutation Name';
            $scope.userRole = Users.getMe().role;
            $scope.levelExps = {
                SR: $sce.trustAsHtml('<div><strong>Level R1:</strong> NCCN-compendium listed biomarker for resistance to a FDA-approved drug.<br/>Example 1: Colorectal cancer with KRAS mutation → resistance to cetuximab<br/>Example 2: EGFR-L858R or exon 19 mutant lung cancers with coincident T790M mutation → resistance to erlotinib</div>'),
                IR: $sce.trustAsHtml('<div><strong>Level R2:</strong> Not NCCN compendium-listed biomarker, but clinical evidence linking this biomarker to drug resistance.<br/>Example: Resistance to crizotinib in a patient with metastatic lung adenocarcinoma harboring a CD74-ROS1 rearrangement (PMID: 23724914).<br/><strong>Level R3:</strong> Not NCCN compendium-listed biomarker, but preclinical evidence potentially linking this biomarker to drug resistance.<br/>Example: Preclinical evidence suggests that BRAF V600E mutant thyroid tumors are insensitive to RAF inhibitors (PMID: 23365119).<br/></div>')
            };
            $scope.showHideButtons = [
                {'key': 'prevelenceShow', 'display': 'Prevalence'},
                {'key': 'proImShow', 'display': 'Prognostic implications'},
                {'key': 'nccnShow', 'display': 'NCCN guidelines'},
                {'key': 'ssShow', 'display': 'Standard implications for sensitivity to therapy'},
                {'key': 'srShow', 'display': 'Standard implications for resistance to therapy'},
                {'key': 'isShow', 'display': 'Investigational implications for sensitivity to therapy'},
                {'key': 'irShow', 'display': 'Investigational implications for resistance to therapy'},
                {'key': 'trialsShow', 'display': 'Ongoing clinical trials'}
            ];
            $scope.list = [];
            $scope.sortableOptions = {
                stop: function (e, ui) {
                    console.log('dropindex', ui.dropindex);
                    console.log('index', ui.index);
                    console.log(e, ui);
                },
                beforeStop: function (e, ui) {
                    console.log('dropindex', ui.dropindex);
                    console.log('index', ui.index);
                    console.log(e, ui);
                }
                // handle: '> .myHandle'
            };
            $scope.selfParams = {};
            $scope.geneStatus = {};
            $scope.oncoTree = {
                mainTypes: {},
                tumorTypes: {}
            };
            $scope.meta = {
                newMainType: {},
                newTumorType: {}
            };

            $scope.status = {
                expandAll: false,
                hideAllEmpty: false,
                rendering: true,
                numAccordion: 0
            };

            if ($scope.userRole === 8) {
                $scope.status.hideAllObsolete = false;
            } else {
                $scope.status.hideAllObsolete = true;
            }

            $scope.$watch('status.hideAllEmpty', function (n, o) {
                if (n !== o) {
                    if (n) {
                        $scope.isOpenFunc('hideEmpty');
                    } else {
                        $scope.isOpenFunc('showEmpty');
                    }
                }
            });

            $scope.$watch('status.expandAll', function (n, o) {
                if (n !== o) {
                    if (n) {
                        $scope.isOpenFunc('expand');
                    } else {
                        $scope.isOpenFunc('collapse');
                    }
                }
            });

            $scope.$watch('meta.newMainType',function(n, o) {
               if(_.isObject(n) && n.name) {
                   DatabaseConnector.getOncoTreeTumorTypesByMainType(n.name)
                       .then(function(result) {
                           if(result.data) {
                               $scope.oncoTree.tumorTypes = result.data;
                           }
                       });
               }
            });
            getDriveOncokbInfo();
            getOncoTreeMainTypes();
            var clock;
            clock = $interval(function () {
                storage.requireAuth(true).then(function (result) {
                    if (result && !result.error) {
                        console.log('\t checked token', new Date().getTime(), gapi.auth.getToken());
                    } else {
                        documentClosed();
                        console.log('error when renew token in interval func.');
                    }
                });
            }, 600000);


            loadFile().then(function (file) {
                $scope.realtimeDocument = file;

                if ($scope.fileTitle) {
                    var model = $scope.realtimeDocument.getModel();
                    if (!model.getRoot().get('gene')) {
                        var gene = model.create('Gene');
                        model.getRoot().set('gene', gene);
                        $scope.gene = gene;
                        $scope.gene.name.setText($scope.fileTitle);
                        $scope.model = model;
                        afterCreateGeneModel();
                    } else {
                        var numAccordion = 0;
                        model.getRoot().get('gene').mutations.asArray().forEach(function (mutation) {
                            numAccordion += mutation.tumors.length;
                            mutation.tumors.asArray().forEach(function (tumor) {
                                numAccordion += 8;
                                tumor.TI.asArray().forEach(function (ti) {
                                    numAccordion += ti.treatments.length;
                                });
                            });
                        });
                        console.log(numAccordion);
                        $scope.status.numAccordion = numAccordion;
                        $scope.gene = model.getRoot().get('gene');
                        $scope.model = model;
                        afterCreateGeneModel();
                    }
                } else {
                    $scope.model = '';
                }
            });


            // Token expired, refresh
            $rootScope.$on('realtimeDoc.token_refresh_required', function () {
                console.log('--token_refresh_required-- going to refresh page.');
                dialogs.error('Error', 'An error has occurred. This page will be redirected to genes page.');
                documentClosed();
                $location.path('/genes');
            });

            // Other unidentify error
            $rootScope.$on('realtimeDoc.other_error', function () {
                dialogs.error('Error', 'An error has occurred. This page will be redirected to genes page.');
                documentClosed();
                $location.path('/genes');
            });

            // Realtime documet not found
            $rootScope.$on('realtimeDoc.client_error', function () {
                dialogs.error('Error', 'An error has occurred. This page will be redirected to genes page.');
                documentClosed();
                $location.path('/genes');
            });

            // Realtime documet not found
            $rootScope.$on('realtimeDoc.not_found', function () {
                dialogs.error('Error', 'An error has occurred. This page will be redirected to genes page.');
                documentClosed();
                $location.path('/genes');
            });

            $scope.$on('$locationChangeStart', function () {
                storage.closeDocument();
                documentClosed();
            });
        }]
);
