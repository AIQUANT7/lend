"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var lucid_1 = require("@lucid-evolution/lucid");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var initLucid = function () { return __awaiter(void 0, void 0, void 0, function () {
    var lucid;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, lucid_1.Lucid)(new lucid_1.Blockfrost(process.env.API_URL, process.env.API_KEY), "Preprod")];
            case 1:
                lucid = _a.sent();
                return [2 /*return*/, lucid];
        }
    });
}); };
var validator = {
    type: "PlutusV2",
    script: process.env.CBOR,
};
// console.log("cbor1 ", process.env.CBOR);
// console.log("cbor2 ", process.env.CBOR2);
var refiValidator = {
    type: "PlutusV2",
    script: process.env.CBOR2,
};
// console.log("Validator Script:", validator);
// console.log("Refi Validator Script:", refiValidator);
var contractAddress = await initLucid().then(function (lucid) {
    return (0, lucid_1.validatorToAddress)("Preprod", validator);
});
console.log("Contract Address:", contractAddress);
var refiContractAddress = await initLucid().then(function (lucid) {
    return (0, lucid_1.validatorToAddress)("Preprod", refiValidator);
});
console.log("Refi Contract Address:", refiContractAddress);
// Parses Data → JS RoadmapDatum, expecting 15 fields in the Constr
function parseRoadmapDatum(data) {
    if (data instanceof lucid_1.Constr && data.index === 0) {
        var _a = data.fields, maybePreId = _a[0], maybeRoadmapId = _a[1], maybeRoadmapName = _a[2], maybeRoadmapDescription = _a[3], maybeProgress = _a[4], maybeAdminsPkh = _a[5], maybePrePkh = _a[6], maybePreSkh = _a[7], maybeTotalPlasticCredits = _a[8], maybeSoldPlasticCredits = _a[9], maybeTotalPlasticTokens = _a[10], maybeSentPlasticTokens = _a[11], maybeTotalPlastic = _a[12], maybeRecoverPlastic = _a[13], maybeCreatedAt = _a[14];
        // Validate basic types
        if (typeof maybePreId === "string" &&
            typeof maybeRoadmapId === "string" &&
            typeof maybeRoadmapName === "string" &&
            typeof maybeRoadmapDescription === "string" &&
            typeof maybeProgress === "bigint" &&
            Array.isArray(maybeAdminsPkh) &&
            typeof maybePrePkh === "string" &&
            typeof maybePreSkh === "string" &&
            typeof maybeTotalPlasticCredits === "bigint" &&
            typeof maybeSoldPlasticCredits === "bigint" &&
            typeof maybeTotalPlasticTokens === "bigint" &&
            typeof maybeSentPlasticTokens === "bigint" &&
            typeof maybeTotalPlastic === "bigint" &&
            typeof maybeRecoverPlastic === "bigint" &&
            typeof maybeCreatedAt === "string") {
            // Parse admin PKHs array
            var adminsPkh = [];
            for (var _i = 0, maybeAdminsPkh_1 = maybeAdminsPkh; _i < maybeAdminsPkh_1.length; _i++) {
                var adminPkh = maybeAdminsPkh_1[_i];
                if (typeof adminPkh === "string") {
                    adminsPkh.push(adminPkh);
                }
                else {
                    throw new Error("Invalid admin PKH format in array");
                }
            }
            return {
                preId: (0, lucid_1.toText)(maybePreId),
                roadmapId: (0, lucid_1.toText)(maybeRoadmapId),
                roadmapName: (0, lucid_1.toText)(maybeRoadmapName),
                roadmapDescription: (0, lucid_1.toText)(maybeRoadmapDescription),
                progress: maybeProgress,
                adminsPkh: adminsPkh,
                prePkh: maybePrePkh,
                preSkh: maybePreSkh,
                totalPlasticCredits: maybeTotalPlasticCredits,
                soldPlasticCredits: maybeSoldPlasticCredits,
                totalPlasticTokens: maybeTotalPlasticTokens,
                sentPlasticTokens: maybeSentPlasticTokens,
                totalPlastic: maybeTotalPlastic,
                recoverPlastic: maybeRecoverPlastic,
                createdAt: (0, lucid_1.toText)(maybeCreatedAt),
            };
        }
    }
    throw new Error("Invalid roadmap datum format");
}
// Updated Initialize Function with Admin PKH Array
var initializeRoadmap = function (lucid, preId, roadmapId, roadmapName, roadmapDescription, prePkh, preSkh, totalPlasticCredits, totalPlasticTokens, totalPlastic) { return __awaiter(void 0, void 0, void 0, function () {
    var adminPkh, utxos, matchedUtxo, datumToLock, AMOUNT, tx_1, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, getPubKeyHash(lucid)];
            case 1:
                adminPkh = _a.sent();
                return [4 /*yield*/, lucid.utxosAt(refiContractAddress)];
            case 2:
                utxos = _a.sent();
                matchedUtxo = utxos.find(function (utxo) {
                    if (!utxo.datum)
                        return false;
                    try {
                        var datum = lucid_1.Data.from(utxo.datum);
                        return ((0, lucid_1.toText)(datum.fields[0]) === preId &&
                            (0, lucid_1.toText)(datum.fields[1]) === roadmapId);
                    }
                    catch (_a) {
                        return false;
                    }
                });
                if (matchedUtxo) {
                    throw new Error("Roadmap with preId ".concat(preId, " and roadmapId ").concat(roadmapId, " already exists"));
                }
                datumToLock = new lucid_1.Constr(0, [
                    (0, lucid_1.fromText)(preId),
                    (0, lucid_1.fromText)(roadmapId),
                    (0, lucid_1.fromText)(roadmapName),
                    (0, lucid_1.fromText)(roadmapDescription),
                    BigInt(0), // progress
                    [adminPkh], // Properly constructed list
                    prePkh,
                    preSkh,
                    BigInt(totalPlasticCredits),
                    BigInt(0), // soldPlasticCredits
                    BigInt(totalPlasticTokens),
                    BigInt(0), // sentPlasticTokens
                    BigInt(totalPlastic),
                    BigInt(0), // recoverPlastic
                    (0, lucid_1.fromText)(new Date().toISOString()),
                ]);
                AMOUNT = 3000000n;
                return [4 /*yield*/, lucid
                        .newTx()
                        .pay.ToContract(refiContractAddress, {
                        kind: "inline",
                        value: lucid_1.Data.to(datumToLock),
                    })
                        .complete()];
            case 3:
                tx_1 = _a.sent();
                return [2 /*return*/, tx_1];
            case 4:
                err_1 = _a.sent();
                console.error(err_1);
                throw new Error("Failed to initialize roadmap: ".concat(err_1 instanceof Error ? err_1.message : String(err_1)));
            case 5: return [2 /*return*/];
        }
    });
}); };
//
// 2) Token‐related constants (unchanged)
//
var ptPolicyId = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7";
var ptTokenName = (0, lucid_1.fromText)("PLASTIK");
var ptAssetUnit = ptPolicyId + ptTokenName;
var usdmPolicyId = "d4fece6b39f7cd78a3f036b2ae6508c13524b863922da80f68dd9ab7";
var usdmTokenName = (0, lucid_1.fromText)("USDM");
var usdmAssetUnit = usdmPolicyId + usdmTokenName;
var precisionFactor = 1000000n;
//
// 3) Helper: get the current wallet’s PubKeyHash
//
var getPubKeyHash = function (lucid) { return __awaiter(void 0, void 0, void 0, function () {
    var address, paymentCredential;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, lucid.wallet().address()];
            case 1:
                address = _a.sent();
                paymentCredential = (0, lucid_1.getAddressDetails)(address).paymentCredential;
                return [2 /*return*/, (paymentCredential === null || paymentCredential === void 0 ? void 0 : paymentCredential.hash) || ""];
        }
    });
}); };
//
// 4) Updated “LenderAction” builder: now includes AdminWithdraw and AdminReturn
//
var buildLenderAction = function (action) {
    switch (action.type) {
        case "Deposit":
            // Haskell: “Deposit” is the first constructor → index 0, no fields
            return new lucid_1.Constr(0, []);
        case "Withdraw":
            if (action.amount === undefined) {
                throw new Error("Withdraw requires amount");
            }
            // Haskell: 2nd constructor → index 1, one Integer field
            return new lucid_1.Constr(1, [action.amount]);
        case "Redeem":
            // Haskell: 4th constructor → index 3, no fields
            return new lucid_1.Constr(2, []);
        case "FundPlastikToEscrow":
            if (action.amount === undefined) {
                throw new Error("FundPlastikToEscrow requires amount");
            }
            // Haskell: 5th constructor → index 4, one Integer field
            return new lucid_1.Constr(3, [action.amount]);
        case "FundUSDM":
            if (action.amount === undefined) {
                throw new Error("FundUSDM requires amount");
            }
            // Haskell: 6th constructor → index 5, one Integer field
            return new lucid_1.Constr(4, [action.amount]);
        default:
            throw new Error("Unknown action type");
    }
};
// Builds a Constr<Data> matching: LenderDatum adminPkh totalPT totalReward lenders
function buildLenderDatum(datum) {
    // Convert each lender entry ([pkh, [balance, rewardDebt]]) → Constr(0, [pkh, Constr(0, [balance, rewardDebt])])
    var lendersData = datum.lenders.map(function (_a) {
        var pkh = _a[0], _b = _a[1], balance = _b[0], rewardDebt = _b[1];
        return new lucid_1.Constr(0, [pkh, new lucid_1.Constr(0, [balance, rewardDebt])]);
    });
    // Now emit a Constr with index 0 (since Haskell’s single data type LenderDatum gets 0 index)
    // and fields: [adminPkh, totalPT, totalReward, lendersData].
    return new lucid_1.Constr(0, [
        datum.adminsPkh,
        datum.totalPT,
        datum.totalReward,
        lendersData,
    ]);
}
// Parses Data → JS LenderDatum, expecting 4 fields in the Constr
function parseLenderDatum(data) {
    if (data instanceof lucid_1.Constr && data.index === 0) {
        var _a = data.fields, maybeAdminsPkh = _a[0], maybeTotalPT = _a[1], maybeTotalReward = _a[2], maybeLendersData = _a[3];
        if (Array.isArray(maybeAdminsPkh) &&
            typeof maybeTotalPT === "bigint" &&
            typeof maybeTotalReward === "bigint" &&
            Array.isArray(maybeLendersData)) {
            var adminsPkh = [];
            for (var _i = 0, maybeAdminsPkh_2 = maybeAdminsPkh; _i < maybeAdminsPkh_2.length; _i++) {
                var pkh = maybeAdminsPkh_2[_i];
                if (typeof pkh === "string") {
                    adminsPkh.push(pkh);
                }
                else {
                    throw new Error("Invalid admin PKH format in array");
                }
            }
            var lenders = [];
            for (var _b = 0, maybeLendersData_1 = maybeLendersData; _b < maybeLendersData_1.length; _b++) {
                var lenderData = maybeLendersData_1[_b];
                if (lenderData instanceof lucid_1.Constr && lenderData.index === 0) {
                    var _c = lenderData.fields, pkh = _c[0], tupleData = _c[1];
                    if (typeof pkh === "string" &&
                        tupleData instanceof lucid_1.Constr &&
                        tupleData.index === 0) {
                        var _d = tupleData.fields, balance = _d[0], rewardDebt = _d[1];
                        if (typeof balance === "bigint" && typeof rewardDebt === "bigint") {
                            lenders.push([pkh, [balance, rewardDebt]]);
                        }
                    }
                }
            }
            return {
                adminsPkh: adminsPkh,
                totalPT: maybeTotalPT,
                totalReward: maybeTotalReward,
                lenders: lenders,
            };
        }
    }
    throw new Error("Invalid datum format");
}
//
// 6) Deposit function (modified to include adminPkh in the initial datum)
//
function deposit(lucid, depositAmount) {
    return __awaiter(this, void 0, void 0, function () {
        var pkh_1, contractUTxOs, userAddress, initialDatum, contractUTxO, currentDatum_1, lenderExists_1, updatedLenders, newBalance, newRewardDebt, newDatum, userUtxos, userUtxo, redeemer, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, getPubKeyHash(lucid)];
                case 1:
                    pkh_1 = _c.sent();
                    console.log("lender Pkh:", pkh_1);
                    return [4 /*yield*/, lucid.utxosAt(contractAddress)];
                case 2:
                    contractUTxOs = _c.sent();
                    return [4 /*yield*/, lucid.wallet().address()];
                case 3:
                    userAddress = _c.sent();
                    console.log("User Address:", userAddress);
                    console.log("Contract UTxOs:", contractUTxOs);
                    // 6.3) If no UTxO ⇒ first deposit ever, we must initialize the datum with (adminPkh, totalPT, totalReward, lenders)
                    if (contractUTxOs.length === 0) {
                        initialDatum = {
                            adminsPkh: [pkh_1],
                            totalPT: depositAmount,
                            totalReward: 0n,
                            lenders: [[pkh_1, [depositAmount, 0n]]],
                        };
                        console.log("Initial Datum:", initialDatum);
                        return [2 /*return*/, lucid
                                .newTx()
                                .pay.ToContract(contractAddress, { kind: "inline", value: lucid_1.Data.to(buildLenderDatum(initialDatum)) }, (_a = {},
                                // lock exactly depositAmount PLASTIK tokens into the script
                                _a[ptAssetUnit] = depositAmount,
                                _a))
                                .complete()];
                    }
                    contractUTxO = contractUTxOs[0];
                    if (!contractUTxO.datum) {
                        throw new Error("Missing datum in contract UTxO");
                    }
                    currentDatum_1 = parseLenderDatum(lucid_1.Data.from(contractUTxO.datum));
                    lenderExists_1 = false;
                    updatedLenders = currentDatum_1.lenders.map(function (_a) {
                        var pubKey = _a[0], _b = _a[1], balance = _b[0], rewardDebt = _b[1];
                        if (pubKey === pkh_1) {
                            lenderExists_1 = true;
                            var newBalance = balance + depositAmount;
                            var newRewardDebt = currentDatum_1.lenders[0][1][1]; // keep existing rewardDebt
                            return [pubKey, [newBalance, newRewardDebt]];
                        }
                        return [pubKey, [balance, rewardDebt]];
                    });
                    // If the depositor was not in the list, append them
                    if (!lenderExists_1) {
                        newBalance = depositAmount;
                        newRewardDebt = 0n;
                        updatedLenders.push([pkh_1, [newBalance, newRewardDebt]]);
                    }
                    newDatum = {
                        adminsPkh: currentDatum_1.adminsPkh,
                        totalPT: currentDatum_1.totalPT + depositAmount,
                        totalReward: currentDatum_1.totalReward,
                        lenders: updatedLenders,
                    };
                    return [4 /*yield*/, lucid.wallet().getUtxos()];
                case 4:
                    userUtxos = _c.sent();
                    userUtxo = userUtxos.find(function (utxo) {
                        return utxo.assets[ptAssetUnit] && utxo.assets[ptAssetUnit] >= depositAmount;
                    });
                    if (!userUtxo) {
                        throw new Error("User has insufficient PLASTIK tokens");
                    }
                    redeemer = buildLenderAction({ type: "Deposit" });
                    // 6.10) Construct the new Tx:
                    return [2 /*return*/, lucid
                            .newTx()
                            .collectFrom([contractUTxO], lucid_1.Data.to(redeemer))
                            .collectFrom([userUtxo])
                            .pay.ToContract(contractAddress, { kind: "inline", value: lucid_1.Data.to(buildLenderDatum(newDatum)) }, __assign(__assign({}, contractUTxO.assets), (_b = {}, _b[ptAssetUnit] = (contractUTxO.assets[ptAssetUnit] || 0n) + depositAmount, _b)))
                            .attach.Script(validator)
                            .addSigner(userAddress)
                            .complete()];
                case 5:
                    error_1 = _c.sent();
                    console.error("Deposit error:", error_1.message);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function withdraw(lucid, withdrawAmount) {
    return __awaiter(this, void 0, void 0, function () {
        var pkh_2, contractUTxOs, userAddress, contractUTxO, currentDatum, userLenderIndex_1, _a, _, _b, currentBalance, currentRewardDebt, updatedLenders, pendingReward, newDatum, contractPtBalance, redeemer, remainingAssets, tx_2, usdmAssetUnit_1, contractUsdmBalance, error_2;
        var _c, _d;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getPubKeyHash(lucid)];
                case 1:
                    pkh_2 = _f.sent();
                    return [4 /*yield*/, lucid.utxosAt(contractAddress)];
                case 2:
                    contractUTxOs = _f.sent();
                    return [4 /*yield*/, lucid.wallet().address()];
                case 3:
                    userAddress = _f.sent();
                    // Check if contract has any UTxOs
                    if (contractUTxOs.length === 0) {
                        throw new Error("No contract UTxOs found - nothing to withdraw");
                    }
                    contractUTxO = contractUTxOs[0];
                    if (!contractUTxO.datum) {
                        throw new Error("Missing datum in contract UTxO");
                    }
                    currentDatum = parseLenderDatum(lucid_1.Data.from(contractUTxO.datum));
                    userLenderIndex_1 = currentDatum.lenders.findIndex(function (_a) {
                        var pubKey = _a[0], _ = _a[1];
                        return pubKey === pkh_2;
                    });
                    if (userLenderIndex_1 === -1) {
                        throw new Error("User is not a lender in this contract");
                    }
                    _a = currentDatum.lenders[userLenderIndex_1], _ = _a[0], _b = _a[1], currentBalance = _b[0], currentRewardDebt = _b[1];
                    // Check if user has sufficient balance
                    if (currentBalance < withdrawAmount) {
                        throw new Error("Insufficient balance. Available: ".concat(currentBalance, ", Requested: ").concat(withdrawAmount));
                    }
                    updatedLenders = currentDatum.lenders
                        .map(function (_a, index) {
                        var pubKey = _a[0], _b = _a[1], balance = _b[0], rewardDebt = _b[1];
                        if (index === userLenderIndex_1) {
                            var newBalance = balance - withdrawAmount;
                            // Recalculate reward debt for new balance
                            var newRewardDebt = 0n;
                            return [pubKey, [newBalance, newRewardDebt]];
                        }
                        return [pubKey, [balance, rewardDebt]];
                    })
                        .filter(function (_a) {
                        var _ = _a[0], _b = _a[1], balance = _b[0], __ = _b[1];
                        return balance > 0n;
                    });
                    pendingReward = 0n;
                    // If user id withdrawing the full stake then we can also pay any pending rewards
                    if (currentBalance === withdrawAmount) {
                        // find the pending reward for the user from their pkh
                        pendingReward =
                            ((_e = currentDatum.lenders.find(function (lender) { return lender[0] === pkh_2; })) === null || _e === void 0 ? void 0 : _e[1][1]) || 0n;
                    }
                    newDatum = {
                        adminsPkh: currentDatum.adminsPkh,
                        totalPT: currentDatum.totalPT - withdrawAmount,
                        totalReward: currentDatum.totalReward - pendingReward,
                        lenders: updatedLenders,
                    };
                    contractPtBalance = contractUTxO.assets[ptAssetUnit] || 0n;
                    if (contractPtBalance < withdrawAmount) {
                        throw new Error("Contract has insufficient PLASTIK tokens");
                    }
                    redeemer = buildLenderAction({
                        type: "Withdraw",
                        amount: withdrawAmount,
                    });
                    remainingAssets = __assign({}, contractUTxO.assets);
                    remainingAssets[ptAssetUnit] = contractPtBalance - withdrawAmount;
                    tx_2 = lucid
                        .newTx()
                        .collectFrom([contractUTxO], lucid_1.Data.to(redeemer))
                        .attach.Script(validator)
                        .addSigner(userAddress);
                    // If there are still lenders or remaining PT, pay back to contract
                    if (newDatum.totalPT > 0n && newDatum.lenders.length > 0) {
                        tx_2.pay.ToContract(contractAddress, { kind: "inline", value: lucid_1.Data.to(buildLenderDatum(newDatum)) }, remainingAssets);
                    }
                    // Pay withdrawn PLASTIK tokens to user
                    tx_2.pay.ToAddress(userAddress, (_c = {},
                        _c[ptAssetUnit] = withdrawAmount,
                        _c));
                    // Pay any pending USDM rewards to user (if any)
                    if (pendingReward > 0n) {
                        usdmAssetUnit_1 = usdmPolicyId + usdmTokenName;
                        contractUsdmBalance = contractUTxO.assets[usdmAssetUnit_1] || 0n;
                        if (contractUsdmBalance >= pendingReward) {
                            tx_2.pay.ToAddress(userAddress, (_d = {},
                                _d[usdmAssetUnit_1] = pendingReward,
                                _d));
                            // Subtract rewards from remaining contract assets
                            remainingAssets[usdmAssetUnit_1] = contractUsdmBalance - pendingReward;
                        }
                    }
                    return [2 /*return*/, tx_2.complete()];
                case 4:
                    error_2 = _f.sent();
                    console.error("Withdraw error:", error_2.message);
                    throw error_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function redeemReward(lucid) {
    return __awaiter(this, void 0, void 0, function () {
        var pkh_3, userAddress, contractUTxOs, contractUTxO, currentDatum, userLenderIndex_2, _a, _, _b, currentBalance, currentRewardDebt, updatedLenders, newDatum, redeemer, remainingAssets, usdmAssetUnit_2, error_3;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getPubKeyHash(lucid)];
                case 1:
                    pkh_3 = _d.sent();
                    return [4 /*yield*/, lucid.wallet().address()];
                case 2:
                    userAddress = _d.sent();
                    return [4 /*yield*/, lucid.utxosAt(contractAddress)];
                case 3:
                    contractUTxOs = _d.sent();
                    if (contractUTxOs.length === 0) {
                        throw new Error("No contract UTxOs found - nothing to redeem");
                    }
                    contractUTxO = contractUTxOs[0];
                    if (!contractUTxO.datum) {
                        throw new Error("Missing datum in contract UTxO");
                    }
                    currentDatum = parseLenderDatum(lucid_1.Data.from(contractUTxO.datum));
                    userLenderIndex_2 = currentDatum.lenders.findIndex(function (_a) {
                        var pubKey = _a[0], _ = _a[1];
                        return pubKey === pkh_3;
                    });
                    if (userLenderIndex_2 === -1) {
                        throw new Error("User is not a lender in this contract");
                    }
                    _a = currentDatum.lenders[userLenderIndex_2], _ = _a[0], _b = _a[1], currentBalance = _b[0], currentRewardDebt = _b[1];
                    if (currentRewardDebt === 0n) {
                        throw new Error("No rewards to redeem");
                    }
                    updatedLenders = currentDatum.lenders.map(function (_a, index) {
                        var pubKey = _a[0], _b = _a[1], balance = _b[0], rewardDebt = _b[1];
                        if (index === userLenderIndex_2) {
                            // Reset the rewardDebt to 0 after redeeming
                            return [pubKey, [balance, 0n]];
                        }
                        return [pubKey, [balance, rewardDebt]];
                    });
                    newDatum = {
                        adminsPkh: currentDatum.adminsPkh,
                        totalPT: currentDatum.totalPT,
                        totalReward: currentDatum.totalReward - currentRewardDebt,
                        lenders: updatedLenders,
                    };
                    redeemer = buildLenderAction({ type: "Redeem" });
                    remainingAssets = __assign({}, contractUTxO.assets);
                    usdmAssetUnit_2 = usdmPolicyId + usdmTokenName;
                    remainingAssets[usdmAssetUnit_2] =
                        (remainingAssets[usdmAssetUnit_2] || 0n) - currentRewardDebt;
                    // Build the transaction
                    return [2 /*return*/, lucid
                            .newTx()
                            .collectFrom([contractUTxO], lucid_1.Data.to(redeemer))
                            .attach.Script(validator)
                            .pay.ToAddress(userAddress, (_c = {},
                            _c[usdmAssetUnit_2] = currentRewardDebt,
                            _c))
                            .pay.ToContract(contractAddress, { kind: "inline", value: lucid_1.Data.to(buildLenderDatum(newDatum)) }, remainingAssets)
                            .complete()];
                case 4:
                    error_3 = _d.sent();
                    console.error("RedeemReward error:", error_3);
                    throw error_3;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function FundPlastik(lucid, preId, roadmapId, soldPlasticCredit) {
    return __awaiter(this, void 0, void 0, function () {
        var adminPkh, adminAddress, utxos, matchedUtxo, refiOldDatum, totalPlasticCredits, newSoldCredits, progress, newSentTokens, recoveredPlastic, updatedDatum, refiRedeemer, plastikToLock, contractUTxOs, contractUTxO, currentDatum_2, contractPtBalance, redeemer, rewardMicro, newTotalReward_1, updatedLenders, remainingAssets, newDatum, refiAssets, error_4;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, getPubKeyHash(lucid)];
                case 1:
                    adminPkh = _c.sent();
                    return [4 /*yield*/, lucid.wallet().address()];
                case 2:
                    adminAddress = _c.sent();
                    return [4 /*yield*/, lucid.utxosAt(refiContractAddress)];
                case 3:
                    utxos = _c.sent();
                    matchedUtxo = utxos.find(function (utxo) {
                        if (!utxo.datum)
                            return false;
                        var datum = lucid_1.Data.from(utxo.datum);
                        return ((0, lucid_1.toText)(datum.fields[0]) === preId &&
                            (0, lucid_1.toText)(datum.fields[1]) === roadmapId);
                    });
                    if (!(matchedUtxo === null || matchedUtxo === void 0 ? void 0 : matchedUtxo.datum)) {
                        throw new Error("No matching roadmap found for preId: ".concat(preId, ", roadmapId: ").concat(roadmapId));
                    }
                    refiOldDatum = parseRoadmapDatum(lucid_1.Data.from(matchedUtxo.datum));
                    totalPlasticCredits = refiOldDatum.totalPlasticCredits;
                    newSoldCredits = refiOldDatum.soldPlasticCredits + soldPlasticCredit;
                    progress = (newSoldCredits * 10000n) / totalPlasticCredits;
                    console.log(progress);
                    newSentTokens = (progress * refiOldDatum.totalPlasticTokens) / 10000n;
                    recoveredPlastic = (progress * refiOldDatum.totalPlastic) / 10000n;
                    updatedDatum = new lucid_1.Constr(0, [
                        (0, lucid_1.fromText)(refiOldDatum.preId), // preId
                        (0, lucid_1.fromText)(refiOldDatum.roadmapId), // roadmapId
                        (0, lucid_1.fromText)(refiOldDatum.roadmapName), // roadmapName
                        (0, lucid_1.fromText)(refiOldDatum.roadmapDescription), // roadmapDescription
                        BigInt(progress), // progress
                        refiOldDatum.adminsPkh, // adminsPkh
                        refiOldDatum.prePkh, // prePkh
                        refiOldDatum.preSkh, // preSkh
                        BigInt(refiOldDatum.totalPlasticCredits), // totalPlasticCredits
                        BigInt(newSoldCredits), // soldPlasticCredits
                        BigInt(refiOldDatum.totalPlasticTokens), // totalPlasticTokens
                        BigInt(newSentTokens), // sentPlasticTokens
                        BigInt(refiOldDatum.totalPlastic), // totalPlastic
                        BigInt(recoveredPlastic), // recoverPlastic
                        (0, lucid_1.fromText)(refiOldDatum.createdAt), // createdAt
                    ]);
                    refiRedeemer = lucid_1.Data.to(new lucid_1.Constr(0, [progress]));
                    plastikToLock = (newSentTokens * 80n) / 100n;
                    return [4 /*yield*/, lucid.utxosAt(contractAddress)];
                case 4:
                    contractUTxOs = _c.sent();
                    // Check if contract has any UTxOs
                    if (contractUTxOs.length === 0) {
                        throw new Error("No contract UTxOs found - nothing to withdraw");
                    }
                    contractUTxO = contractUTxOs[0];
                    if (!contractUTxO.datum) {
                        throw new Error("Missing datum in contract UTxO");
                    }
                    currentDatum_2 = parseLenderDatum(lucid_1.Data.from(contractUTxO.datum));
                    // Check that only the on-chain adminPkh can call “AdminWithdraw”
                    if (!currentDatum_2.adminsPkh.includes(adminPkh)) {
                        throw new Error("Only the admin can withdraw funds");
                    }
                    contractPtBalance = contractUTxO.assets[ptAssetUnit] || 0n;
                    if (contractPtBalance < plastikToLock) {
                        throw new Error("Contract has insufficient PLASTIK tokens");
                    }
                    redeemer = buildLenderAction({
                        type: "FundPlastikToEscrow",
                        amount: plastikToLock,
                    });
                    rewardMicro = soldPlasticCredit * precisionFactor;
                    newTotalReward_1 = currentDatum_2.totalReward + rewardMicro;
                    updatedLenders = currentDatum_2.lenders.map(function (_a) {
                        var pubKey = _a[0], _b = _a[1], balance = _b[0], rewardDebt = _b[1];
                        // Keep rewardDebt as:(balance * newTotalReward) / totalPT
                        var newRewardDebt = (balance * newTotalReward_1) / currentDatum_2.totalPT;
                        return [pubKey, [balance, newRewardDebt]];
                    });
                    remainingAssets = __assign({}, contractUTxO.assets);
                    remainingAssets[ptAssetUnit] =
                        (remainingAssets[ptAssetUnit] || 0n) - plastikToLock;
                    // add the new total reward to the contract
                    remainingAssets[usdmAssetUnit] = newTotalReward_1;
                    newDatum = {
                        adminsPkh: currentDatum_2.adminsPkh,
                        totalPT: currentDatum_2.totalPT,
                        totalReward: newTotalReward_1,
                        lenders: updatedLenders,
                    };
                    refiAssets = __assign((_a = {}, _a[ptAssetUnit] = (matchedUtxo.assets[ptAssetUnit] || 0n) + plastikToLock, _a), (usdmAssetUnit in matchedUtxo.assets
                        ? (_b = {}, _b[usdmAssetUnit] = matchedUtxo.assets[usdmAssetUnit] || 0n, _b) : {}));
                    console.dir(buildLenderDatum(newDatum), { depth: null });
                    // Build the transaction
                    return [2 /*return*/, (lucid
                            .newTx()
                            .collectFrom([contractUTxO], lucid_1.Data.to(redeemer)) // Collect from Lender Contract
                            .attach.Script(validator)
                            .pay.ToContract(
                        // Pay to Lender Contract
                        contractAddress, { kind: "inline", value: lucid_1.Data.to(buildLenderDatum(newDatum)) }, remainingAssets)
                            .addSigner(adminAddress)
                            .complete()
                            .collectFrom([matchedUtxo], lucid_1.Data.to(refiRedeemer)) // Collect from Refi Contract
                            .attach.Script(refiValidator)
                            .pay.ToContract(
                        // Pay to Refi Contract
                        refiContractAddress, { kind: "inline", value: lucid_1.Data.to(updatedDatum) }, refiAssets)
                            .addSigner(adminAddress)
                            .complete())];
                case 5:
                    error_4 = _c.sent();
                    console.error("AdminWithdraw error:", error_4.message);
                    throw error_4;
                case 6: return [2 /*return*/];
            }
        });
    });
}
// async function FundUSDM(
//   lucid: LucidEvolution,
//   returnAmount: bigint
// ): Promise<unknown> {
//   try {
//     // Get the wallet's public key hash of Admin
//     const adminPkh = await getPubKeyHash(lucid);
//     // Fetch existing UTxO at the contract
//     const contractUTxOs = await lucid.utxosAt(contractAddress);
//     // Check if contract has any UTxOs
//     if (contractUTxOs.length === 0) {
//       throw new Error("No contract UTxOs found - nothing to return");
//     }
//     // Get the first contract UTxO (assuming single UTxO for simplicity)
//     const contractUTxO = contractUTxOs[0];
//     if (!contractUTxO.datum) {
//       throw new Error("Missing datum in contract UTxO");
//     }
//     // Parse the existing on-chain datum
//     const currentDatum = parseLenderDatum(Data.from(contractUTxO.datum));
//     // Check that only the on‐chain adminPkh can call “AdminReturn”
//     if (currentDatum.adminPkh !== adminPkh) {
//       throw new Error("Only the admin can return funds");
//     }
//     // Build the redeemer for AdminReturn action
//     const redeemer = buildLenderAction({
//       type: "AdminReturn",
//       amount: returnAmount,
//     });
//     // Calculate remaining assets in the contract after returning
//     const remainingAssets = { ...contractUTxO.assets };
//     remainingAssets[ptAssetUnit] =
//       (remainingAssets[ptAssetUnit] || 0n) + returnAmount;
//     // Build the transaction
//     return lucid
//       .newTx()
//       .collectFrom([contractUTxO], Data.to(redeemer))
//       .attach.Script(validator)
//       .pay.ToContract(
//         contractAddress,
//         { kind: "inline", value: Data.to(buildLenderDatum(currentDatum)) },
//         remainingAssets
//       )
//       .complete();
//   } catch (error: any) {
//     console.error("AdminReturn error:", error.message);
//     throw error;
//   }
// }
var getScriptUtxos = function (lucid, address) { return __awaiter(void 0, void 0, void 0, function () {
    var utxos;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, lucid.utxosAt(address)];
            case 1:
                utxos = _a.sent();
                console.log("Script UTxOs:", utxos);
                utxos.forEach(function (utxo) {
                    if (!utxo.datum)
                        return;
                    var parsed = lucid_1.Data.from(utxo.datum);
                    console.dir(parsed, { depth: null });
                });
                return [2 /*return*/];
        }
    });
}); };
var lucid = await initLucid();
// lucid.selectWallet.fromSeed(process.env.ADMIN_SEED!);
lucid.selectWallet.fromSeed("nest wink neither undo oven labor nature olympic file mandate glass inner cart theme initial fancy glow water mutual flame swap budget reform cute");
// Example usage of deposit function
var tx = await deposit(lucid, 1000n);
if (!tx) {
    throw new Error("Failed to build deposit transaction.");
}
var signed = await tx.sign.withWallet().complete();
var txHash = await signed.submit();
console.log("Deposit tx submitted:", txHash);
// Example usage of withdraw function
// const withdrawTx = await withdraw(lucid, 100n);
// if (!withdrawTx) {
//     throw new Error("Failed to build withdraw transaction.");
// }
// const signedWithdraw = await withdrawTx.sign.withWallet().complete();
// const withdrawTxHash = await signedWithdraw.submit();
// console.log("Withdraw tx submitted:", withdrawTxHash);
// Example usage of Redeem Reward function
// const redeemRewardTx = await redeemReward(lucid);
// if (!redeemRewardTx) {
//     throw new Error("Failed to build withdraw transaction.");
// }
// const signedRedeemReward = await redeemRewardTx.sign.withWallet().complete();
// const redeemRewardTxHash = await signedRedeemReward.submit();
// console.log("redeemRewardTx tx submitted:", redeemRewardTxHash);
// Example usage of Initialize Rodmap function
// const initializeRoadmapTx = await initializeRoadmap(
//     lucid,
//     "pre1",
//     "roadmap1",
//     "CleanCoast Mission",
//     "Focused on removing plastic waste from coastal regions and supporting local recycling units.",
//     "b93e78824bcf5c34a62b2f573727b4bb8a1365ebd152bd6243ff8dc6",
//     "a786470d2a2c8bc00ecaf662a64407364be25325f33d1cb9446b4bd7",
//     100n,
//     10000n,
//     100n
// );
// if (!initializeRoadmapTx) {
//     throw new Error("Failed to build withdraw transaction.");
// }
// const signedinitializeRoadmap = await initializeRoadmapTx.sign
//     .withWallet()
//     .complete();
// const initializeRoadmapTxHash = await signedinitializeRoadmap.submit();
// console.log("initializeRoadmap tx submitted:", initializeRoadmapTxHash);
// Example usage of Fund Plastik function
// const tx = await FundPlastik(lucid, "pre1", "roadmap1", 1n);
// if (!tx) {
//     throw new Error("Failed to build deposit transaction.");
// }
// const signed = await tx.sign.withWallet().complete();
// const txHash = await signed.submit();
// console.log("FundPlastik tx submitted:", txHash);
// Example usage of getScriptUtxos function
// getScriptUtxos(lucid, contractAddress);
