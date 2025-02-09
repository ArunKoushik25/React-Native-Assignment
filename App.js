import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ToastAndroid,
} from "react-native";
import axios from "axios";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

const API_URL = "https://testapi.getlokalapp.com/common/jobs?page=";

const Home = ({ navigation }) => {
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now.toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.homeContainer}>
        <Text style={styles.homeTitle}>Welcome to Job Finder</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("Jobs")}
        >
          <Text style={styles.buttonText}>Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("Bookmarks")}
        >
          <Text style={styles.buttonText}>Bookmarks</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.dateTimeText}>{currentDateTime}</Text>
    </SafeAreaView>
  );
};

const JobList = ({ savedJobs, setSavedJobs, navigation }) => {
  const [jobList, setJobList] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchJobData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredJobs(jobList);
    } else {
      const filtered = jobList.filter((job) =>
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.primary_details?.Place?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.primary_details?.Salary?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
  }, [searchQuery, jobList]);

  const fetchJobData = async () => {
    try {
      setIsLoading(true);
      const result = await axios.get(`${API_URL}${currentPage}`);
      if (result.data && result.data.results) {
        setJobList((prevJobs) => [...prevJobs, ...result.data.results]);
        setFilteredJobs((prevJobs) => [...prevJobs, ...result.data.results]);
        setCurrentPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveJob = (job) => {
    if (!savedJobs.some((savedJob) => savedJob.id === job.id)) {
      setSavedJobs([...savedJobs, job]);
      ToastAndroid.show("Job saved!", ToastAndroid.SHORT);
    } else {
      ToastAndroid.show("Job already saved!", ToastAndroid.SHORT);
    }
  };

  const renderJob = ({ item }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate("JobDetails", { job: item })}
    >
      <Text style={styles.jobName}>{item?.title || "No Title"}</Text>
      <Text>{item?.primary_details?.Place || "No Location"}</Text>
      <Text>{item?.primary_details?.Salary || "No Salary Info"}</Text>
      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => saveJob(item)}
      >
        <Icon name="bookmark-border" size={24} color="#007BFF" />
        <Text style={styles.saveText}>Save Job</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search jobs by title, location, or salary..."
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />
      {isLoading && <ActivityIndicator size="large" color="#007BFF" />}
      <FlatList
        data={filteredJobs}
        renderItem={renderJob}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        onEndReached={fetchJobData}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

const SavedJobs = ({ savedJobs, setSavedJobs, navigation }) => {
  const removeJob = (jobId) => {
    const updatedJobs = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(updatedJobs);
    ToastAndroid.show("Job removed!", ToastAndroid.SHORT);
  };

  const renderSavedJob = ({ item }) => (
    <View style={styles.jobCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate("JobDetails", { job: item })}
      >
        <Text style={styles.jobName}>{item.title || "No Title"}</Text>
        <Text>{item.primary_details?.Place || "No Location"}</Text>
        <Text>{item.primary_details?.Salary || "No Salary Info"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeJob(item.id)}
      >
        <Icon name="delete" size={24} color="#FF3B30" />
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screenContainer}>
      {savedJobs.length === 0 ? (
        <Text style={styles.noJobsText}>No saved jobs!</Text>
      ) : (
        <FlatList
          data={savedJobs}
          renderItem={renderSavedJob}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </SafeAreaView>
  );
};

const JobDetails = ({ route }) => {
  const { job } = route.params;

  return (
    <SafeAreaView style={styles.screenContainer}>
      {job ? (
        <>
          <Text style={styles.infoTitle}>{job.title || "No Title"}</Text>
          <Text>Location: {job.primary_details?.Place || "N/A"}</Text>
          <Text>Salary: {job.primary_details?.Salary || "N/A"}</Text>
          <Text>Applications: {job.num_applications || "N/A"}</Text>
          <Text>Openings: {job.openings_count || "N/A"}</Text>
          <Text>Other Details: {job.other_details || "N/A"}</Text>
          <Text>Contact: {job.whatsapp_no || "N/A"}</Text>
        </>
      ) : (
        <Text style={styles.noJobsText}>Job details not available.</Text>
      )}
    </SafeAreaView>
  );
};

const Stack = createStackNavigator();

const App = () => {
  const [savedJobs, setSavedJobs] = useState([]);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Jobs">
          {(props) => (
            <JobList {...props} savedJobs={savedJobs} setSavedJobs={setSavedJobs} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Bookmarks">
          {(props) => (
            <SavedJobs {...props} savedJobs={savedJobs} setSavedJobs={setSavedJobs} />
          )}
        </Stack.Screen>
        <Stack.Screen name="JobDetails" component={JobDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, padding: 10 },
  homeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFDD0", // Cream color
  },
  homeTitle: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  homeButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 18 },
  dateTimeText: { textAlign: "center", marginBottom: 10 },
  jobCard: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  jobName: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { marginLeft: 5, color: "#007BFF" },
  searchBar: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    color: "#000",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  removeText: { marginLeft: 5, color: "#FF3B30" },
  noJobsText: { textAlign: "center", fontSize: 18, marginTop: 20 },
  infoTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  darkModeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
});

export default App;
