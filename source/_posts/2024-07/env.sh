#!/bin/bash

# 检查是否在容器内
is_container=$(grep -q "docker\|lxc" /proc/1/cgroup && echo "Yes" || echo "No")
nested_virtualization=$(egrep -q 'amd-v|svm' /sys/module/kvm_intel/parameters/nested && echo "Yes" || echo "No")

# 硬件信息
cpu_model=$(cat /proc/cpuinfo | grep name | cut -f2 -d: | uniq -c)
cpu_cores=$(nproc --all)
gpu_info=$(lspci | grep VGA)
memory_size=$(free -m -h)

# 硬盘信息
disk_info=$(lsblk -d -o NAME,FSTYPE,LABEL,SIZE,TYPE,PKNAME,MOUNTPOINT | grep disk)
# disk_speed=$(sudo hdparm -Tt /dev/sda | grep Timing)

# 网络信息
lan_ip=$(hostname -I | awk '{print $1}')
public_ip=$(curl -s ifconfig.me)
# public_speed=$(speedtest-cli --simple | grep Download)
gateway=$(ip route | grep default | awk '{print $3}')
port_usage=$(netstat -tuln | grep LISTEN)
# open_ports=$(ss -ln | awk '{print $4}' | cut -d: -f2 | sort -n | uniq)

# 用户权限
user_groups=$(groups)
has_docker_perms=$(grep docker /etc/group | grep -w $(whoami) && echo "Yes" || echo "No")
# has_sudo_perms=$(id -nu $(id -u) | grep sudo && echo "Yes" || echo "No")

# 输出结果
echo "Container Environment: $is_container"
echo "Nested Virtualization: $nested_virtualization"
echo "CPU Model: $cpu_model"
echo "CPU Cores: $cpu_cores"
echo "GPU Info: $gpu_info"
echo "Memory Size: $memory_size MB"
echo "Disk Info: $disk_info"
echo "Disk Speed: $disk_speed"
echo "LAN IP: $lan_ip"
echo "Public IP: $public_ip"
echo "Public Speed: $public_speed"
echo "Default Gateway: $gateway"
echo "Port Usage: $port_usage"
echo "Open Ports: $open_ports"
echo "User Groups: $user_groups"
echo "Docker Permissions: $has_docker_perms"
echo "Sudo Permissions: $has_sudo_perms"