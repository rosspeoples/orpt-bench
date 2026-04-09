# Router dnsmasq notes

This fixture mirrors the earlier Ubuntu router layout.

- dnsmasq reads drop-in config from `/srv/router/dnsmasq.d`.
- Extra host entries come from `/srv/router/hosts/router.hosts`.
- DHCP leases are written to `/var/lib/thepeoples/router/dnsmasq.leases`.
- The pid file is `/run/thepeoples/dnsmasq/dnsmasq.pid`.
- Keep AppArmor in enforce mode and extend the local include rather than disabling the profile.
