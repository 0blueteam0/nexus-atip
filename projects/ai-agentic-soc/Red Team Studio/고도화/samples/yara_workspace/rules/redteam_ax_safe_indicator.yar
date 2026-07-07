rule RedTeamAxSafeIndicator
{
    meta:
        description = "Benign RedTeam AX local YARA smoke rule"
        evidence_type = "local_indicator_match"
        severity = "informational"
    strings:
        $marker = "REDTEAM_AX_YARA_SAFE_MARKER"
    condition:
        $marker
}
