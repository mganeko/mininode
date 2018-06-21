require "./minruby"
require "json"

# read file 
str = minruby_load()

# parse line
tree = minruby_parse(str)

# write to json
json_file_path = 'fizzbuzz_tree.json';
j = { tree: tree };
open(json_file_path, 'w') do |io|
  JSON.dump(j, io)
end
