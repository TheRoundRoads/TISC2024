# Challenge 1: Navigating the Digital Labyrinth
We are given the alias of the target as "vi_vox223".
After some searches across common websites and social media platforms, we find that this account exists on Instagram.
Looking through the posts and story highlights, the only thing that stands out is his texts with another person about his Discord bot.
In the stories, he provides the ID of the discord bot. We can then add the discord bot to our own Discord server to use it.
Furthermore, the story says that if you use the role D0PP3L64N63R, you can access new features.
In the server, add the role, and run the !help command. It shows a list of new commands as well as some files.
The file of concern is the .eml file, which is an Outlook mail file. It can be downloaded using the !download command.

Looking at the eml file, there are 2 parts:
1. it provides some hexadecimal strings related to Uber's latest geospatial technology system
2. it asks us to contact via a seucre communications channel, provided by a linkedin page

For the Uber portion, we either use the website or the quickstart documentation provided to get the latitude and longitude of the id. Inputting those values in Google Maps, we get the location "Quercia secolare".

For the linkedin page, we see one of the posts contains a telegram bot meant to provide definitions of English words. When we send the location to the bot, it provides us the flag.

# Challenge 2: Language, Labyrinth and (Graphics)Magick
There is a website which allows us to upload an image, and input commands.
By trying a common command "rotate", it shows the original image and the image rotated by 90 degrees.
However, the website also provides a hash.txt file upon running the command, opening it, we can see the following line: 
```gm convert /tmp/e42a0566dca049ad9f1f8df5c6d8bc1b_cat.png -rotate 90 /tmp/e42a0566dca049ad9f1f8df5c6d8bc1b_cat.png_output.png```

We now know that we can probably try some form of command injection, to access other files in the file system.
Probably what the program does is try to run ```gm convert <file> -<input command> ...```
I tried the pipe command | but it didn't work, but fortunately ";" works.
So just upload any image file, and use the command "rotate; cat file.txt"
After retrying it, sometimes it doesn't work. I think there are some bugs in the system, but when I did it for the first time, it worked.

# Challenge 3: Digging up History
The challenge provides us with an ad1 file upon unzipping the zip file. After a quick search, ad1 file represents the file system of a windows computer. It can be opened using an application "FTK Imager".
After opening the file, we see an entire file system of a Windows XP machine. 
After some searching around, we can go to Documents and Settings/csitfan1/Recent. There are a few files that act as shortcuts to a file called "flag.txt" which used to be in the user's Desktop but doesn't exist anymore.
Hence we need to find another way to find the flag. After some searching on google, the system file $LogFile might contain useful information (plus it is a very large file, so it probably has a lot of data).

After searching for the string "TISC" in $LogFile, we find a fake flag "TISC{y0u_th0ught_1t_w45_e4zy_f4k3_f14g}".
This might be a bit discouraging, but by luck, if you look at the following bytes after that, and put it into CyberChef, it happens to be base64 encoded, and represents the first part of the flag.
However, it is not the full flag. But by some luck again, if we encode the string "TISC" in base64, we get the following string "VElTQ", which we can then search for in $LogFile, and we obtain the full base64 encoded flag.

# Challenge 4: AlligatorPay
The challenge involves a website which shows card details, and checks card balance.
Upon looking at the html, we find a very long javascript code, as well as a comment saying a test card can be obtained at /testcard.agpay.
Downloading the testcard file and uploading it to the website, the interface changes, and it shows us the card number, expiry date, and balance.

From the HTML comments again, we find that our objective is to upload a card with balance $313371337.

Now we can look at the javascript code.
Basically what it does is decrypt a custom file format, which is the agpay format. The sections of the hexdump of the file are as follows:
1. Signature (0x00 to 0x04): Must be AGPAY, else not accepted
2. Version (0x05 to 0x06): Version, in the example they gave 01, so we just stick with it.
3. Encryption key (0x07 to 0x26): 32 bytes of AES-CBC encryption key.
4. Reserved (0x27 to 0x2F): 10 bytes of anything
5. iv (0x30 to 0x40): 16 bytes of iv for AES-CBC
6. Encrypted data (0x41 to 23rd last byte of file): As long as it needs to be. In the test card, it is 49 bytes
7. Footer signature (22nd last byte to 17th last byte): Must be ENDAGP, marks the end of encrypted data.
8. Checksum (Last 16 bytes of file): MD5 hash of concatanation of iv and encrypted data.

The main point of interest is generating the encrypted data. Based on the javascript file, we know that the original data is 32 bytes long.
1. Card number (First 16 bytes): In the testcard, they use the numbers 1234567890123456. It doesn't matter.
2. Buffer space (Next 4 bytes): Sort of the padding, to make sure total length is 32 bytes later on. It doesn't matter what is here.
3. Expiration date (Next 4 bytes): Apparently it uses Unix-Timestamp. Just use the one given in the card, which is 1715280000.
4. Balance (Last 8 bytes): This is the part that matters. Change the value to the target value 313371337 when encrypting.

Using the file create_alligator.js, it generates the card file to upload. There will be an alert, providing the flag.
