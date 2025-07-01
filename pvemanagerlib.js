{
    itemId: 'sensors-info',
    colspan: 2,
    printBar: false,
    title: gettext('传感器'),
    textField: 'sensors_info',
    renderer: function(value) {
        value = value.replace(/Â/g, '');
        let data = [];
        let output = '';

        // --- CPU (Package/Tctl + CCD) ---
        let cpus = value.matchAll(/^(?:coretemp-isa|k10temp-pci)-(\w{4})$\n.*?\n((?:Package|Core|Tctl|Tccd\d+)[\s\S]*?^\n)+/gm);
        for (const cpu of cpus) {
            let cpuNumber = parseInt(cpu[1], 10);
            data[cpuNumber] = {
                packages: [],
                ccds: []
            };

            // Tctl / Package
            let packages = cpu[2].matchAll(/^(?:Package id \d+|Tctl):\s*\+([^°C ]+).*$/gm);
            for (const pkg of packages) {
                data[cpuNumber]['packages'].push(pkg[1]);
            }

            // CCD
            let ccds = cpu[2].matchAll(/^Tccd\d+:\s*\+([^°C ]+).*$/gm);
            for (const ccd of ccds) {
                data[cpuNumber]['ccds'].push(ccd[1]);
            }
        }

        for (const [i, cpu] of data.entries()) {
            if (cpu && (cpu.packages.length > 0 || cpu.ccds.length > 0)) {
                output += `CPU ${i}: `;
                if (cpu.packages.length > 0) {
                    output += `Tctl=${cpu.packages.join('°C, ')}°C`;
                }
                if (cpu.ccds.length > 0) {
                    if (cpu.packages.length > 0) output += ', ';
                    output += 'CCD=' + cpu.ccds.map(v => `${v}°C`).join(', ');
                }
                output += ' | ';
            }
        }

        // --- ACPI ---
        let acpitzs = value.matchAll(/^acpitz-acpi-(\d*)$\n.*?\n((?:temp)[\s\S]*?^\n)+/gm);
        for (const acpitz of acpitzs) {
            let acpitzNumber = parseInt(acpitz[1], 10);
            if (!data[acpitzNumber]) {
                data[acpitzNumber] = {};
            }
            data[acpitzNumber]['acpisensors'] = [];

            let acpisensors = acpitz[2].matchAll(/^temp\d+:\s*\+([^°C ]+).*$/gm);
            for (const acpisensor of acpisensors) {
                data[acpitzNumber]['acpisensors'].push(acpisensor[1]);
            }
        }

        for (const [i, acpitz] of data.entries()) {
            if (acpitz && acpitz.acpisensors && acpitz.acpisensors.length > 0) {
                output += '主板: ';
                for (const acpiTemp of acpitz.acpisensors) {
                    output += `${acpiTemp}°C, `;
                }
                output = output.slice(0, -2) + ' | ';
            }
        }

        // --- MLX5 ---
        let mlx5s = value.matchAll(/^(mlx5-pci-\w+)\nAdapter:[^\n]*\n((?:sensor\d+:[^\n]*\n)+)/gm);
        for (const mlx5 of mlx5s) {
            let nicName = mlx5[1];
            let nicSensors = mlx5[2];
            output += `${nicName}: `;
            let sensors = nicSensors.matchAll(/^sensor\d+:\s*\+([^°C ]+).*$/gm);
            for (const sensor of sensors) {
                output += `${sensor[1]}°C, `;
            }
            output = output.slice(0, -2) + ' | ';
        }

        // --- 结尾清理 ---
        output = output.replace(/\s+\|\s*$/, '');

        return output.replace(/\n/g, '<br>');
    }
},
