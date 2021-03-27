# AutoClaim eCRV

I wrote this script so that I will get the most out of eCRV rewards by automatically claiming every hour. It is set to run every minute. Rewards are calculated and given at the bottom of every hour. There are configurations you can use to increase the interval.

## Settings

Create a `.env` file and add these settings.  

#### PRIVATEKEY
It is highly recommended that you create a separate key that gives permissions for ONLY the actions that this script will perform. Unless you can guarantee security of the server, like you are running it from your local network, you should not use your active key in this script.  

#### ACCOUNTNAME
This is your EOS account name

#### PERMISSION
This is the permission.  

#### INTERVAL
This is the interval the script will run, in milliseconds. 1000 = 1 second. I have mine set to 60000 which is 1 minute.  

The file should look like this:
```dotenv
PRIVATEKEY=yourPrivateKey
ACCOUNTNAME=yourAcctName
PERMISSION=yourPermission
INTERVAL=60000 #this is ok to leave at 60000, that will be every minute
```

## Setup Service
Please contact me on Telegram (`@tvle83`), and I can help set up a server for this script. The process is very quick, and your private key will never be exposed to me. Everything can be set up, and the private key can be added by you, after I am done. 

If you are setting this up yourself and do not have an account at DigitalOcean or Vultr, please consider using my referral link:

Digital Ocean: https://m.do.co/c/fd67d238a7c4

Vultr: https://www.vultr.com/?ref=8832658-6G

## Questions/Comments

If there are issues or feature requests for this project please use the github issues tab. 

`@tvle83` on telegram

I also run https://DaddyDAO.io for the DAD community. I am a software developer and on the msig for the DAO.

If you find this script useful and would like to donate to me I greatly appreciate it.

My FIO Address is `thomas@edge` for BTC, ETH, USDT.

My EOS address is `thomassamoht`.



