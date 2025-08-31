/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SlashCommand, CommandKind } from './types.js';

const powerShellScript = `#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Removes all IIS sites except Default Web Site and their associated web data.

.DESCRIPTION
    This script removes all IIS sites and their physical directories except for the Default Web Site.
    It must be run as an administrator on Windows Server with IIS installed.

.EXAMPLE
    .\\Remove-AllSites.ps1
    Removes all sites except Default Web Site

.NOTES
    - Requires Administrator privileges
    - Requires IIS to be installed
    - Backs up site configurations before deletion
#>

[CmdletBinding(SupportsShouldProcess)]
param()

# Import required modules
try {
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "WebAdministration module loaded successfully" -ForegroundColor Green
}
catch {
    Write-Error "Failed to import WebAdministration module. Ensure IIS is installed."
    exit 1
}

# Function to create backup of IIS configuration
function Backup-IISConfiguration {
    $backupName = "BeforeRemoveAllSites_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    try {
        Backup-WebConfiguration -Name $backupName
        Write-Host "IIS configuration backed up as: $backupName" -ForegroundColor Yellow
        return $backupName
    }
    catch {
        Write-Warning "Failed to backup IIS configuration: $_"
        return $null
    }
}

# Function to safely remove directory
function Remove-WebDirectory {
    param([string]$Path)
    
    if (Test-Path $Path) {
        try {
            Remove-Item -Path $Path -Recurse -Force
            Write-Host "Removed directory: $Path" -ForegroundColor Green
        }
        catch {
            Write-Warning "Failed to remove directory $Path\`: $_"
        }
    }
}

# Main execution
Write-Host "Starting removal of all IIS sites except Default Web Site..." -ForegroundColor Cyan

# Create backup
$backupName = Backup-IISConfiguration

# Get all sites except Default Web Site
$sitesToRemove = Get-Website | Where-Object { $_.Name -ne "Default Web Site" }

if ($sitesToRemove.Count -eq 0) {
    Write-Host "No sites found to remove (only Default Web Site exists)" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($sitesToRemove.Count) site(s) to remove:" -ForegroundColor Yellow
$sitesToRemove | ForEach-Object {
    Write-Host "  - $($_.Name) (Path: $($_.PhysicalPath))" -ForegroundColor White
}

# Confirm action
$confirmation = Read-Host "\`nThis will permanently delete these sites and their data. Continue? (y/N)"
if ($confirmation -notmatch '^[Yy]$') {
    Write-Host "Operation cancelled by user" -ForegroundColor Yellow
    exit 0
}

# Remove sites and their data
foreach ($site in $sitesToRemove) {
    $siteName = $site.Name
    $physicalPath = $site.PhysicalPath
    
    Write-Host "\`nProcessing site: $siteName" -ForegroundColor Cyan
    
    try {
        # Stop the site first
        if ($site.State -eq "Started") {
            Stop-Website -Name $siteName
            Write-Host "Stopped site: $siteName" -ForegroundColor Green
        }
        
        # Remove the website
        Remove-Website -Name $siteName
        Write-Host "Removed IIS site: $siteName" -ForegroundColor Green
        
        # Remove physical directory if it exists and is not a system directory
        if ($physicalPath -and $physicalPath -ne "" -and $physicalPath -notmatch '^[A-Za-z]:\\\\Windows\\\\') {
            Remove-WebDirectory -Path $physicalPath
        }
        
        # Remove any associated application pools that are no longer used
        $unusedAppPools = Get-IISAppPool | Where-Object {
            $poolName = $_.Name
            $sitesUsingPool = Get-Website | Where-Object { $_.ApplicationPool -eq $poolName }
            return $sitesUsingPool.Count -eq 0 -and $poolName -ne "DefaultAppPool"
        }
        
        foreach ($pool in $unusedAppPools) {
            try {
                Remove-WebAppPool -Name $pool.Name
                Write-Host "Removed unused application pool: $($pool.Name)" -ForegroundColor Green
            }
            catch {
                Write-Warning "Failed to remove application pool $($pool.Name): $_"
            }
        }
    }
    catch {
        Write-Error "Failed to remove site $siteName\`: $_"
    }
}

# Final status
$remainingSites = Get-Website
Write-Host "\`nOperation completed. Remaining sites:" -ForegroundColor Cyan
$remainingSites | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}

if ($backupName) {
    Write-Host "\`nIIS configuration backup available: $backupName" -ForegroundColor Yellow
    Write-Host "To restore if needed: Restore-WebConfiguration -Name $backupName" -ForegroundColor Yellow
}

Write-Host "\`nAll sites except Default Web Site have been removed." -ForegroundColor Green`;

export const removeAllSitesCommand: SlashCommand = {
  name: 'remove-all-sites',
  altNames: ['clearallsites', 'cleariis'],
  description: 'Remove all IIS sites except Default Web Site (requires admin privileges)',
  kind: CommandKind.BUILT_IN,
  action: async (context, args) => {
    // Execute the embedded PowerShell script directly
    const command = `powershell -ExecutionPolicy Bypass -Command "${powerShellScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`;
    
    return {
      type: 'tool',
      toolName: 'run_shell_command',
      toolArgs: {
        command,
        description: 'Removing all IIS sites except Default Web Site',
        directory: process.cwd(),
      },
    };
  },
};