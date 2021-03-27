import "reflect-metadata";
import {Api, JsonRpc} from 'eosjs';
const dotenv     = require('dotenv').config({path: __dirname + '/.env'});
import {JsSignatureProvider} from "eosjs/dist/eosjs-jssig";

async function main() {
	const fetch             = require('node-fetch');
	const rpc               = new JsonRpc('http://api.main.alohaeos.com', {fetch}); //required to read blockchain state
	const signatureProvider = new JsSignatureProvider([`${process.env.PRIVATEKEY}`]);
	const chainId           = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'; // EOS MainNet

	const api = new Api({
		rpc, signatureProvider, chainId, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()
	});

	let claimAmount = 0.0;

	// Get claimable amount from locked ECRV
	let ecrvClaimResult = await api.rpc.get_table_rows({
		code       : 'ecrvclaim111',
		table      : 'claimtab',
		scope      : 'ecrvclaim111',
		lower_bound: `${process.env.ACCOUNTNAME}`,
		upper_bound: `${process.env.ACCOUNTNAME}`
	});

	console.log(`${ecrvClaimResult.rows[0].owner} can claim ${ecrvClaimResult.rows[0].issuedamt} from staked eCRV`)

	claimAmount += parseFloat(ecrvClaimResult.rows[0].issuedamt.split(" ")[0]);

	// get claimable amount from locked DAD
	let dadClaimResult = await api.rpc.get_table_rows({
		code       : 'dadlockecrv1',
		table      : 'claimtab',
		scope      : 'dadlockecrv1',
		lower_bound: `${process.env.ACCOUNTNAME}`,
		upper_bound: `${process.env.ACCOUNTNAME}`
	});

	console.log(`${dadClaimResult.rows[0].owner} can claim ${dadClaimResult.rows[0].issuedamt} from staked DAD`)

	claimAmount += parseFloat(dadClaimResult.rows[0].issuedamt.split(" ")[0]);

	console.log(`Total to be claimed is ${claimAmount} ECRV`)

	console.log(`Claiming ${claimAmount} ECRV`)
	let claimEcrvResult = await api
		.transact({
			"actions": [
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
				},
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
			]
		}, {
			broadcast    : true,
			blocksBehind : 3,
			expireSeconds: 60
		})
		.then(result => {
			console.log(result)
			if (result.processed.receipt.status === 'executed') {
				console.log(`Successfully Claimed ECRV`)
			}
		})
		.catch(err => {
			if(err.json.error.code !== 3050003) {
				console.error(err);
				console.log(err.json.error.code);
			}
		})

	// BOOST
	if(claimAmount > 0) {
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
							"memo"    : `claiming with ecrv-autoclaim`
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
	} else {
		console.log(`Claim amount is ${claimAmount}, cannot boost right now`)
	}
}

console.log(`Starting in 1 minute`);
setInterval(() =>{
	main();
	console.log(`Will check again in 1 minute`)
}, parseInt(`${process.env.INTERVAL}`));

