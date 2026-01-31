#!/bin/bash

# Fix unused state parameter
fix_file() {
    local file=$1
    local param=$2
    
    echo "Fixing $file - unused $param parameter"
    
    # Check if parameter is only assigned to this.param but never used
    if grep -q "this\.$param =" "$file" && ! grep -q "this\.$param\." "$file"; then
        # Remove the property and fix constructor
        sed -i "/private $param:.*/d" "$file"
        sed -i "s/constructor.*(state: AppState, $param: AppDependencies)/constructor (state: AppState, _$param: AppDependencies)/" "$file"
        sed -i "s/this\.$param = $param//" "$file"
        sed -i "s/this\.$param = _$param//" "$file"
        # Remove empty lines
        sed -i '/^[[:space:]]*$/d' "$file"
    fi
}

# Files with unused app parameter
for file in js/modules/features/daily-review.ts \
            js/modules/features/dashboard.ts \
            js/modules/features/priority-scoring.ts \
            js/modules/features/productivity-heatmap.ts \
            js/modules/features/smart-suggestions.ts \
            js/modules/features/subtasks.ts; do
    if [ -f "$file" ]; then
        fix_file "$file" "app"
    fi
done

# Files with unused state parameter
for file in js/modules/features/data-export-import.ts \
            js/modules/features/new-project-button.ts \
            js/modules/features/project-modal.ts \
            js/modules/features/subtasks.ts; do
    if [ -f "$file" ]; then
        fix_file "$file" "state"
    fi
done

echo "Done!"
