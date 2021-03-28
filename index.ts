import "reflect-metadata";
import {Api, JsonRpc} from 'eosjs';

const dotenv = require('dotenv').config({path: __dirname + '/.env'});
import {JsSignatureProvider} from "eosjs/dist/eosjs-jssig";

const consolestamp      = require('console-stamp')(console, '[HH:MM:ss.l]');
const fetch             = require('node-fetch');
const rpc               = new JsonRpc('http://api.main.alohaeos.com', {fetch}); //required to read blockchain state
const signatureProvider = new JsSignatureProvider([`${process.env.PRIVATEKEY}`]);
const chainId           = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'; // EOS MainNet

const api = new Api({
	rpc, signatureProvider, chainId, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()
});

let enableClaimDAD = false;
let enableClaimLP  = false;
let enableBoost    = false;

if (process.env.ENABLEBOOST === '1') {
	enableBoost = true;
}

if (process.env.ENABLECLAIMLP === '1') {
	enableClaimLP = true;
}

if (process.env.ENABLECLAIMDAD === '1') {
	enableClaimDAD = true;
}

async function main() {
	let claimAmount = 0.0;

	if (enableClaimLP) {
		claimAmount += await checkLpClaimAmount();
	}

	if (enableClaimDAD) {
		claimAmount += await checkDadClaimAmount();
	}

	if (claimAmount > 0) {
		claimAmount = parseFloat(claimAmount.toFixed(4));

		console.log(`Total to be claimed is ${claimAmount} ECRV`)

		console.log(`Claiming ${claimAmount} ECRV`)

		let actions = [];
		actions.push(
			{
				"account"      : "ecrvclaim111",
				"name"         : "claim",
				"authorization": [
					{
						"actor"     : `${process.env.ACCOUNTNAME}`,
						"permission": `${process.env.PERMISSION}`
					}
				],
				"data"         : {
					"owner": `${process.env.ACCOUNTNAME}`
				}
			}
		);

		if (enableClaimDAD) {
			actions.push(
				{
					"account"      : "dadlockecrv1",
					"name"         : "claim",
					"authorization": [
						{
							"actor"     : `${process.env.ACCOUNTNAME}`,
							"permission": `${process.env.PERMISSION}`
						}
					],
					"data"         : {
						"owner": `${process.env.ACCOUNTNAME}`
					}
				}
			)
		}

		let claimEcrvResult = await api
			.transact({
				"actions": actions
			}, {
				broadcast    : true,
				blocksBehind : 3,
				expireSeconds: 60
			})
			.then(result => {
				console.log(result)
				if (result.processed.receipt.status === 'executed') {
					console.log(`Successfully Claimed ECRV`)
					if (enableBoost) {
						// BOOST
						api.transact(
							{
								"actions": [
									{
										"account"      : "ecurvetoken1",
										"name"         : "transfer",
										"authorization": [
											{
												"actor"     : `${process.env.ACCOUNTNAME}`,
												"permission": `${process.env.PERMISSION}`
											}
										],
										"data"         : {
											"from"    : `${process.env.ACCOUNTNAME}`,
											"to"      : "ecrvgovlock1",
											"quantity": `${claimAmount} ECRV`,
											"memo"    : `boosting with AutoClaim eCRV`
										}
									},
									{
										"account"      : "ecrvgovlock1",
										"name"         : "incramt",
										"authorization": [
											{
												"actor"     : `${process.env.ACCOUNTNAME}`,
												"permission": `${process.env.PERMISSION}`
											}
										],
										"data"         : {
											"account" : `${process.env.ACCOUNTNAME}`,
											"quantity": `${claimAmount} ECRV`
										}
									}
								]
							},
							{
								broadcast    : true,
								blocksBehind : 3,
								expireSeconds: 60
							}
						)
						   .then(result => {
							   console.log(`Boosted successfully`);
							   console.log(result);
						   })
						   .catch(error => {
							   console.error(error);
						   })
					}
				}
			})
			.catch(err => {
				if (err.json.error.code !== 3050003) {
					console.error(err);
					console.log(err.json.error.code);
				}
			})
	} else {
		console.log(`Claim amount is ${claimAmount}`)
	}
}

const checkLpClaimAmount = async (): Promise<number> => {
	let claimAmount = 0.0;

	// Get claimable amount from locked ECRV
	let ecrvClaimResult = await api.rpc.get_table_rows({
		code       : 'ecrvclaim111',
		table      : 'claimtab',
		scope      : 'ecrvclaim111',
		lower_bound: `${process.env.ACCOUNTNAME}`,
		upper_bound: `${process.env.ACCOUNTNAME}`
	});


	claimAmount += parseFloat(ecrvClaimResult.rows[0].issuedamt.split(" ")[0]);
	if (claimAmount > 0) {
		console.log(`${ecrvClaimResult.rows[0].owner} can claim ${ecrvClaimResult.rows[0].issuedamt} from staked eCRV`)
	}

	return claimAmount;
}

const checkDadClaimAmount = async (): Promise<number> => {
	let claimAmount    = 0.0;
	// get claimable amount from locked DAD
	let dadClaimResult = await api.rpc.get_table_rows({
		code       : 'dadlockecrv1',
		table      : 'claimtab',
		scope      : 'dadlockecrv1',
		lower_bound: `${process.env.ACCOUNTNAME}`,
		upper_bound: `${process.env.ACCOUNTNAME}`
	});

	claimAmount += parseFloat(dadClaimResult.rows[0].issuedamt.split(" ")[0]);
	if(claimAmount > 0) {
		console.log(`${dadClaimResult.rows[0].owner} can claim ${dadClaimResult.rows[0].issuedamt} from staked DAD`)
	}

	return claimAmount;
}


// Startup
let interval: number = 0;

if (process.env.INTERVAL !== undefined) {
	interval = parseInt(process.env.INTERVAL.toString()) / 60000;
}
main();
setInterval(() => {
	main();
	console.log(`Will check again in ${interval} minute`)
}, parseInt(`${process.env.INTERVAL}`));

