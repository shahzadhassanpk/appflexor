

apt install python3-certbot-dns-cloudflare
certbot certonly --manual --preferred-challenges=dns -d step2agility.com -d '*.step2agility.com'
certbot certonly --dns-cloudflare --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini -d step2agility.com -d '*.step2agility.com'


certbot certonly --manual --preferred-challenges=dns -d appflexor.com -d '*.appflexor.com'
certbot certonly --dns-cloudflare --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini -d appflexor.com -d '*.appflexor.com'



certbot certonly --manual --preferred-challenges=dns -d lightindark.com -d '*.lightindark.com'

certbot certonly --dns-cloudflare --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini -d lightindark.com -d '*.lightindark.com'

certbot certonly --manual --preferred-challenges=dns -d humz-international.com -d '*.humz-international.com'
certbot certonly --dns-cloudflare --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini -d humz-international.com -d '*.humz-international.com'


certbot renew --dry-run --cert-name appflexor.com