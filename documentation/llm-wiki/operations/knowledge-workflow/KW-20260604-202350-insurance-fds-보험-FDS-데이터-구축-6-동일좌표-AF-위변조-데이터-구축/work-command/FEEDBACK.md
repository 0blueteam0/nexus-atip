# FEEDBACK

## User correction incorporated

User correction: Existing NO coordinate positions must be the same, and tampered values must be inserted at those same positions.

## Implementation response

The new v3.2 generator creates AF by copying the paired NO image and overwriting only the original target field bbox. The validation gate ensures all NO/AF/tamper evidence bboxes match and that pixel changes stay inside the bbox.
