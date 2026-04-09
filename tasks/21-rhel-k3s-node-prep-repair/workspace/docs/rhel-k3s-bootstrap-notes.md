# RHEL k3s bootstrap notes

These nodes are Rocky/Alma/RHEL style hosts, not Debian/Ubuntu nodes.

- Use the RHEL-native firewalld and SELinux path.
- Keep SELinux enforcing and install the host policy packages needed by k3s.
- Load `overlay` and `br_netfilter` before bootstrap.
- Set `net.ipv4.ip_forward=1` and `net.bridge.bridge-nf-call-iptables=1`.
- Bootstrap still uses flannel VXLAN, so `8472/udp` must be open.
- `6443/tcp`, `10250/tcp`, and the NodePort range `30000-32767/tcp` must also be open.
- Keep `selinux: true` in the checked-in `k3s` config.
- The kubeconfig file mode remains `0640`.
