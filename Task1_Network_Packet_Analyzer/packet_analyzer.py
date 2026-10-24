"""Simple network packet analyzer (CodSoft Cyber Security Internship, Task 1).

Captures live packets with Scapy, extracts key fields, prints them as a table,
and optionally saves them to a CSV file.

Run with sudo (packet capture needs root):
    sudo ./venv/bin/python packet_analyzer.py --filter icmp --count 10 -o capture.csv

Only capture traffic on networks you own or are authorized to monitor.
"""

import argparse
import csv
import sys,os
from collections import Counter

from scapy.all import sniff, get_if_list, IP, IPv6, TCP, UDP
from scapy.error import Scapy_Exception

PROTOCOL_NAMES = {1: "ICMP", 6: "TCP", 17: "UDP", 58: "ICMPv6"}
CSV_FIELDS = ["version", "protocol", "src", "sport", "dst", "dport",
              "flags", "length", "preview"]
ROW_FORMAT = ("{version:<5}{protocol:<9}{src:<40}{sport:<7}{dst:<40}"
              "{dport:<7}{flags:<6}{length:<6}{preview}")

protocol_counts = Counter()
csv_writer = None  # set in main() when --output is given


def payload_preview(payload, limit=24):
    """Return the first bytes of a payload as safe printable text.

    Packet data is untrusted, so only printable ASCII (32-126) is shown;
    everything else becomes '.', which blocks terminal escape sequences.
    """
    chunk = payload[:limit]
    return "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)


def csv_safe(text):
    """Stop spreadsheet apps from treating packet data as a formula."""
    if text and text[0] in ("=", "+", "-", "@"):
        return "'" + text
    return text


def extract_packet_info(packet):
    """Pull the fields we care about into a dict. Return None if not IP."""
    if packet.haslayer(IP):
        ip_layer, version, proto = packet[IP], "IPv4", packet[IP].proto
    elif packet.haslayer(IPv6):
        ip_layer, version, proto = packet[IPv6], "IPv6", packet[IPv6].nh
    else:
        return None

    sport, dport, flags, payload = "-", "-", "-", b""
    if packet.haslayer(TCP):
        tcp = packet[TCP]
        sport, dport = tcp.sport, tcp.dport
        flags = str(tcp.flags)
        payload = bytes(tcp.payload)
    elif packet.haslayer(UDP):
        udp = packet[UDP]
        sport, dport = udp.sport, udp.dport
        payload = bytes(udp.payload)

    return {
        "version": version,
        "src": ip_layer.src,
        "dst": ip_layer.dst,
        "protocol": PROTOCOL_NAMES.get(proto, f"Other({proto})"),
        "sport": sport,
        "dport": dport,
        "flags": flags,
        "length": len(payload),
        "preview": payload_preview(payload),
    }


def print_header():
    print(ROW_FORMAT.format(version="VER", protocol="PROTO", src="SOURCE IP",
                            sport="SPORT", dst="DEST IP", dport="DPORT",
                            flags="FLAGS", length="LEN", preview="PAYLOAD"))
    print("-" * 150)


def process_packet(packet):
    """Called once for every captured packet."""
    info = extract_packet_info(packet)
    if info is None:
        protocol_counts["Non-IP"] += 1
        print(f"(non-IP) {packet.summary()}")
        return

    protocol_counts[info["protocol"]] += 1
    print(ROW_FORMAT.format(**info))

    if csv_writer is not None:
        row = dict(info)
        row["preview"] = csv_safe(info["preview"])
        csv_writer.writerow(row)


def parse_args():
    parser = argparse.ArgumentParser(description="Simple network packet analyzer")
    parser.add_argument("-i", "--interface", default="en0",
                        help="network interface (default: en0)")
    parser.add_argument("-c", "--count", type=int, default=30,
                        help="number of packets to capture (default: 30, 0 = until Ctrl+C)")
    parser.add_argument("-f", "--filter", default="",
                        help='BPF filter, e.g. "icmp" or "tcp port 443"')
    parser.add_argument("-o", "--output", default=None,
                        help="save packets to this CSV file")
    args = parser.parse_args()
    if args.count < 0:
        parser.error("--count must be 0 or greater")
    return args


def main():
    global csv_writer
    args = parse_args()

    if args.interface not in get_if_list():
        sys.exit(f"Unknown interface '{args.interface}'. "
                 f"Available: {', '.join(get_if_list())}")

    csv_file = None
    if args.output:
        try:
            csv_file = open(args.output, "x", newline="", encoding="utf-8",
                opener=lambda path, flags: os.open(path, flags, 0o600))
        except OSError as err:
            sys.exit(f"Cannot open output file: {err}")
        csv_writer = csv.DictWriter(csv_file, fieldnames=CSV_FIELDS)
        csv_writer.writeheader()

    print(f"Capturing on {args.interface} (filter: {args.filter or 'none'})... "
          "Ctrl+C to stop.")
    print_header()

    try:
        sniff(iface=args.interface, filter=args.filter or None,
              prn=process_packet, count=args.count, store=False)
    except PermissionError:
        sys.exit("Permission denied: run with sudo.")
    except (OSError, ValueError, Scapy_Exception) as err:
        sys.exit(f"Capture error (bad interface or filter?): {err}")
    except KeyboardInterrupt:
        print("\nStopped by user.")
    finally:
        if csv_file:
            csv_file.close()

    print("\n--- Summary ---")
    for name, total in protocol_counts.most_common():
        print(f"{name:<10}{total}")
    if args.output:
        print(f"Saved IP packets to {args.output}")


if __name__ == "__main__":
    main()